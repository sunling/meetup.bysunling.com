// 获取基础URL
function getBaseUrl(event) {
  const headers = event.headers
  const host = headers.host || headers.Host
  const protocol = headers['x-forwarded-proto'] || 'https'
  return `${protocol}://${host}`
}

// 验证邮箱格式
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 验证密码强度
function isValidPassword(password) {
  // 至少6个字符
  return password && password.length >= 6
}

// 验证用户名
function isValidUsername(username) {
  // 至少2个字符，只允许字母、数字、下划线和连字符
  const usernameRegex = /^[a-zA-Z0-9_-]{2,}$/
  return usernameRegex.test(username)
}

// 生成随机字符串
function generateRandomString(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 格式化错误响应
function formatErrorResponse(statusCode, message, headers = {}) {
  const defaultHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  }

  return {
    statusCode,
    headers: { ...defaultHeaders, ...headers },
    body: JSON.stringify({ error: message })
  }
}

// 格式化成功响应
function formatSuccessResponse(data, statusCode = 200, headers = {}) {
  const defaultHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  }

  return {
    statusCode,
    headers: { ...defaultHeaders, ...headers },
    body: JSON.stringify(data)
  }
}

module.exports = {
  getBaseUrl,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  generateRandomString,
  formatErrorResponse,
  formatSuccessResponse
}