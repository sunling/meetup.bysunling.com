// netlify/functions/submitRsvp.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { meetup_id, name, wechat_id, status } = JSON.parse(event.body);

    if (!meetup_id || !name || !wechat_id || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Check if meetup exists and is approved (or legacy null status)
    const { data: meetup, error: meetupError } = await supabase
      .from('meetups')
      .select('id, status')
      .eq('id', meetup_id)
      .or('status.eq.approved,status.is.null')
      .maybeSingle();

    if (meetupError || !meetup) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Meetup not found or not approved for registration' }),
      };
    }

    const { data, error } = await supabase
      .from('meetup_rsvps')
      .insert([{ meetup_id, name, wechat_id, status }])
      .select();

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to submit RSVP', details: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: data[0].id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error', message: err.message }),
    };
  }
}
