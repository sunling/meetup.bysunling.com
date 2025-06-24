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

    // Build query conditions
    let query = supabase
      .from('meetup_rsvps')
      .select(`
        *,
        meetups!inner(
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

    // Add filters based on available identifiers
    if (username) {
      query = query.eq('username', username);
    } else if (name && wechat_id) {
      query = query.eq('name', name).eq('wechat_id', wechat_id);
    } else if (name) {
      query = query.eq('name', name);
    } else if (wechat_id) {
      query = query.eq('wechat_id', wechat_id);
    }

    // Filter by RSVP status if specified
    if (status) {
      query = query.eq('status', status);
    }

    // Only include approved meetups (or legacy null status)
    query = query.or('meetups.status.eq.approved,meetups.status.is.null');

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data: rsvps, error } = await query;

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch user RSVPs', details: error.message }),
      };
    }

    // Transform the data to include meetup details at the top level
    const transformedRsvps = rsvps.map(rsvp => ({
      rsvp_id: rsvp.id,
      rsvp_status: rsvp.status,
      rsvp_created_at: rsvp.created_at,
      ...rsvp.meetups,
      // Add RSVP count for each meetup
      rsvp_count: 0 // Will be populated separately if needed
    }));

    // Get RSVP counts for each meetup
    const meetupIds = transformedRsvps.map(item => item.id);
    if (meetupIds.length > 0) {
      const { data: counts } = await supabase
        .from('meetup_rsvps')
        .select('meetup_id')
        .in('meetup_id', meetupIds)
        .eq('status', 'going');

      // Count RSVPs for each meetup
      const countMap = {};
      if (counts) {
        counts.forEach(item => {
          countMap[item.meetup_id] = (countMap[item.meetup_id] || 0) + 1;
        });
      }

      // Add counts to transformed data
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