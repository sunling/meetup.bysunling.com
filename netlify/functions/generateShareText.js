export const handler = async (event, context) => {
  // 只允许POST请求
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

  // 处理CORS预检请求
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
    // 从环境变量获取OpenRouter API密钥
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: '服务器配置错误：缺少API密钥' })
      };
    }

    // 解析请求体
    const { eventInfo, eventUrl } = JSON.parse(event.body);
    
    if (!eventInfo || !eventUrl) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: '缺少必要参数：eventInfo 和 eventUrl' })
      };
    }

    // 构建AI提示词
    const prompt = `请根据以下活动信息，生成一个吸引人的社交媒体分享文案。要求：
1. 语言生动有趣，能吸引人参与
2. 突出活动的亮点和价值
3. 包含适当的emoji表情
4. 长度适中，适合微信朋友圈或微博分享
5. 最后包含报名链接

活动信息：
${eventInfo}

报名链接：${eventUrl}

请生成分享文案：`;

    // 调用OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://meetup.bysunling.com',
        'X-Title': 'Meetup Share Generator'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: `AI服务调用失败: ${response.status}`,
          details: errorText
        })
      };
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        shareText: generatedText
      })
    };

  } catch (error) {
    console.error('Generate share text error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: '生成分享文案失败',
        details: error.message
      })
    };
  }
};