class AuthUtils {
  // 保存认证信息
  saveAuth(token, user) {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
  }

  // 获取token
  getToken() {
    return localStorage.getItem('auth_token')
  }

  // 获取用户信息
  getUser() {
    const userStr = localStorage.getItem('auth_user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch (e) {
        console.error('解析用户信息失败:', e)
        return null
      }
    }
    return null
  }

  // 检查是否已登录
  isLoggedIn() {
    return !!this.getToken()
  }

  // 清除认证信息
  clearAuth() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  // 跳转到登录页面
  redirectToLogin(redirectUrl = null) {
    const currentUrl = redirectUrl || window.location.href
    const encodedRedirect = encodeURIComponent(currentUrl)
    window.location.href = `/auth.html?redirect=${encodedRedirect}`
  }

  // 跳转到首页
  redirectToHome() {
    window.location.href = '/'
  }
}

// 创建全局实例
window.authUtils = new AuthUtils()

// 支持模块化导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthUtils
}