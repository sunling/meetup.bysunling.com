import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function handler(event, context) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // First get all meetups
    const { data: meetups, error: meetupsError } = await supabase
      .from('meetups')
      .select('id, title, datetime, location, description, qrcode, status')
      .or('status.eq.approved,status.is.null')
      .order('datetime', { ascending: false });

    if (meetupsError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch meetups' }),
      };
    }

    // Get RSVP counts for each meetup
    const meetupsWithCounts = await Promise.all(
      meetups.map(async (meetup) => {
        const { count, error: countError } = await supabase
          .from('meetup_rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('meetup_id', meetup.id);

        return {
          ...meetup,
          rsvp_count: countError ? 0 : (count || 0)
        };
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(meetupsWithCounts),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected error', message: err.message }),
    };
  }
}
