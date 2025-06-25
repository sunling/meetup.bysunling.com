const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// JWT密钥，建议在环境变量中设置
const JWT_SECRET = process.env.JWT_SECRET

exports.handler = async function(event, context) {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: '只允许POST请求' })
    }
  }

  try {
    const { email, password } = JSON.parse(event.body || '{}')

    // 验证输入
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '邮箱和密码都是必填项' })
      }
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '邮箱格式不正确' })
      }
    }

    // 查找用户
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, username, email, password, name')
      .eq('email', email)
      .single()

    if (fetchError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '邮箱或密码错误' })
      }
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '邮箱或密码错误' })
      }
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: '登录成功',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        },
        token
      })
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '登录过程中发生错误' })
    }
  }
}