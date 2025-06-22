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
    const { meetup_id, name, wechat_id, status, username } = JSON.parse(event.body);

    if (!meetup_id || !name || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // 只有在"确定参加"时才要求微信号
    if (status === 'going' && !wechat_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'WeChat ID is required for going status' }),
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

    // 构建插入数据，如果有username则包含它
    const insertData = { meetup_id, name, wechat_id, status };
    if (username) {
      insertData.username = username;
    }

    const { data, error } = await supabase
      .from('meetup_rsvps')
      .insert([insertData])
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
