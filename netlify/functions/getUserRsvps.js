// netlify/functions/getUserRsvps.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { username, name, wechat_id, status } = event.queryStringParameters || {};

    if (!username && !name && !wechat_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'At least one identifier (username, name, or wechat_id) is required' }),
      };
    }

    // Build base query
    let query = supabase
      .from('meetup_rsvps')
      .select(`
        id,
        meetup_id,
        name,
        wechat_id,
        status,
        created_at,
        username,
        meetups:meetup_id (
          id,
          title,
          description,
          datetime,
          location,
          creator,
          status,
          created_at
        )
      `);

    // Add filters
    if (username) {
      query = query.eq('username', username);
    } else if (name && wechat_id) {
      query = query.eq('name', name).eq('wechat_id', wechat_id);
    } else if (name) {
      query = query.eq('name', name);
    } else if (wechat_id) {
      query = query.eq('wechat_id', wechat_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // 只返回 approved/null 的 meetup
    // query = query.or('meetups.status.eq.approved,meetups.status.is.null');

    query = query.order('created_at', { ascending: false });

    const { data: rsvps, error } = await query;

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch user RSVPs', details: error.message }),
      };
    }

    // Transform response
    const transformedRsvps = rsvps.map(rsvp => ({
      rsvp_id: rsvp.id,
      rsvp_status: rsvp.status,
      rsvp_created_at: rsvp.created_at,
      ...rsvp.meetups,
      rsvp_count: 0
    }));

    // Count RSVPs going for each meetup
    const meetupIds = transformedRsvps.map(item => item.id);
    if (meetupIds.length > 0) {
      const { data: counts } = await supabase
        .from('meetup_rsvps')
        .select('meetup_id')
        .in('meetup_id', meetupIds.map(String)) // ensure match type
        .eq('status', 'going');

      const countMap = {};
      if (counts) {
        counts.forEach(item => {
          countMap[item.meetup_id] = (countMap[item.meetup_id] || 0) + 1;
        });
      }

      transformedRsvps.forEach(item => {
        item.rsvp_count = countMap[item.id] || 0;
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify(transformedRsvps),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error', message: err.message }),
    };
  }
}