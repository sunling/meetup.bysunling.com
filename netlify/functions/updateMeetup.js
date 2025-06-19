import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { formatDateTimeForStorage } from '../../scripts/timeUtils.js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { token, qrcode, title, datetime, location, description } = JSON.parse(event.body);

    if (!token) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ error: '缺少 token 参数' })
      };
    }

    // Check if we have either qrcode or meetup info to update
    const hasQrcode = qrcode && qrcode.trim();
    const hasMeetupInfo = title || datetime || location || description;
    
    if (!hasQrcode && !hasMeetupInfo) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ error: '请提供要更新的内容' })
      };
    }

    // First, get the meetup ID from the token
    const { data: meetupData, error: meetupError } = await supabase
      .from('meetups')
      .select('id')
      .eq('manage_token', token)
      .single();

    if (meetupError || !meetupData) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ error: '无效的管理令牌' })
      };
    }

    // Prepare update object
    const updateData = {};
    
    if (hasQrcode) {
      updateData.qrcode = qrcode;
    }
    
    if (hasMeetupInfo) {
      if (title) updateData.title = title;
      if (datetime) {
        // 使用统一的时间处理函数
        updateData.datetime = formatDateTimeForStorage(datetime);
      }
      if (location) updateData.location = location;
      if (description) updateData.description = description;
    }

    // Update the meetup
    const { data, error } = await supabase
      .from('meetups')
      .update(updateData)
      .eq('id', meetupData.id)
      .select();

    if (error) {
      console.error('Update error:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ error: '更新失败' })
      };
    }

    // Determine success message
    let message = '更新成功';
    if (hasQrcode && hasMeetupInfo) {
      message = '活动信息和二维码更新成功';
    } else if (hasQrcode) {
      message = '二维码更新成功';
    } else if (hasMeetupInfo) {
      message = '活动信息更新成功';
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        success: true, 
        message,
        meetup: data[0]
      })
    };

  } catch (err) {
    console.error('Handler error:', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ error: '服务器内部错误' })
    };
  }
};