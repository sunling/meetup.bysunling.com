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
    const { username, email, password, name } = JSON.parse(event.body || '{}')

    // 验证输入
    if (!username || !email || !password || !name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '姓名、用户名、邮箱和密码都是必填项' })
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

    // 验证密码长度
    if (password.length < 6) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '密码至少需要6个字符' })
      }
    }

    // 验证用户名长度
    if (username.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '用户名至少需要2个字符' })
      }
    }

    // 验证姓名长度
    if (name.length < 1) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '姓名或昵称不能为空' })
      }
    }

    // 检查邮箱是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: '该邮箱已被注册' })
      }
    }

    // 检查用户名是否已存在
    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single()

    if (existingUsername) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: '该用户名已被使用' })
      }
    }

    // 加密密码
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // 创建用户
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password: hashedPassword,
        name
      })
      .select('id, username, email')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: '注册失败，请稍后重试' })
      }
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: '注册成功',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          name: name
        },
        token
      })
    }
  } catch (error) {
    console.error('Register error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '注册过程中发生错误' })
    }
  }
}