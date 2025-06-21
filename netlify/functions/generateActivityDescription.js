exports.handler = async (event, context) => {
  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { title, location, duration, currentDescription } = JSON.parse(event.body);

    if (!title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '活动标题不能为空' })
      };
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY not found in environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API配置错误' })
      };
    }

    // 构建AI提示词
    const prompt = `请根据以下活动信息，生成一个详细且吸引人的活动介绍，包括活动议程安排：
    活动标题：${title}，活动地点：${location}，活动时长：${duration}，当前描述：${currentDescription}。
    请生成一个包含以下内容的活动介绍：
    1. 活动概述和目标
    2. 具体的活动安排
    3. 参与者将获得什么
    4. 适合人群
    5. 注意事项或准备工作
    要求：
      - 语言生动有趣，富有吸引力
      - 议程安排要具体且合理
      - 内容要尽量真诚
      - 字数严格控制在250字内
      - 不要包含markdown格式的符号
      - 使用中文回复`;
    // 调用 OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json; charset=utf-8',
        'HTTP-Referer': 'https://meetup.bysunling.com',
        'X-Title': 'you are alone cause we havnt meet yet'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'AI服务暂时不可用' })
      };
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const generatedDescription = data.choices[0].message.content.trim();

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          description: generatedDescription
        })
      };
    } else {
      console.error('Unexpected API response format:', data);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: '生成活动介绍失败' })
      };
    }

  } catch (error) {
    console.error('Error generating activity description:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '服务器内部错误' })
    };
  }
};