import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { meetup_id, status, admin_token } = JSON.parse(event.body);

    // Simple admin token validation (you should use a more secure method)
    if (admin_token !== process.env.ADMIN_TOKEN) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    if (!meetup_id || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Validate status value
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid status. Must be pending, approved, or rejected' }),
      };
    }

    // First check if the meetup exists
    const { data: existingMeetup, error: checkError } = await supabase
      .from('meetups')
      .select('id, title')
      .eq('id', meetup_id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking meetup:', checkError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database error', details: checkError.message }),
      };
    }

    if (!existingMeetup) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Meetup not found with ID: ' + meetup_id }),
      };
    }

    // Update the meetup status
    const { data, error } = await supabase
      .from('meetups')
      .update({ status })
      .eq('id', meetup_id)
      .select('id, title, status');

    if (error) {
      console.error('Error updating meetup:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update meetup status', details: error.message }),
      };
    }

    if (!data || data.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Meetup not found after update' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        meetup: data[0],
        message: `Meetup status updated to ${status}` 
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected error', message: err.message }),
    };
  }
}