// 用户认证管理器
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.retryCount = 0;
    this.maxRetries = 20; // 最大重试次数
    this.initialized = false;
    this.init();
  }

  // 初始化认证管理器
  async init() {
    if (this.initialized) return;
    
    try {
      // 从URL参数中获取用户信息
      const urlParams = new URLSearchParams(window.location.search);
      const userParam = urlParams.get('user');
      
      if (userParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userParam));
          this.currentUser = userData;
          
          // 将用户信息存储到localStorage
          localStorage.setItem('currentUser', JSON.stringify(userData));
          
          // 清理URL参数
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('user');
          window.history.replaceState({}, '', newUrl);
        } catch (e) {
          console.error('Failed to parse user data from URL:', e);
        }
      } else {
        // 尝试从主域名 cookie 中获取认证信息
        const authFromCookie = this.getAuthFromCookie();
        if (authFromCookie) {
          this.currentUser = authFromCookie;
          // 同步到localStorage
          localStorage.setItem('currentUser', JSON.stringify(authFromCookie));
        } else {
          // 从localStorage获取用户信息
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            try {
              this.currentUser = JSON.parse(storedUser);
            } catch (e) {
              console.error('Failed to parse stored user data:', e);
              localStorage.removeItem('currentUser');
            }
          }
        }
      }
      
      this.initialized = true;
      this.updateUI();
    } catch (error) {
      console.error('Auth manager initialization error:', error);
      this.initialized = true;
    }
  }

  // 从主域名 cookie 中获取认证信息
  getAuthFromCookie() {
    try {
      // 使用 CrossDomainAuth 实例获取认证信息
      if (typeof CrossDomainAuth !== 'undefined') {
        const crossDomainAuth = new CrossDomainAuth();
        const token = crossDomainAuth.getToken();
        const user = crossDomainAuth.getUser();
        if (token && user) {
          return {
            ...user,
            authToken: token
          };
        }
      }
      
      return null;
    } catch (e) {
      console.error('Failed to get auth data from CrossDomainAuth:', e);
      return null;
    }
  }

  // 获取当前用户
  async getCurrentUser() {
    if (!this.initialized) {
      await this.init();
    }
    return this.currentUser;
  }

  // 检查用户是否已登录
  async isLoggedIn() {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // 登出
  logout() {
    // 使用跨域名认证工具清除登录状态
    if (window.crossDomainAuth) {
      window.crossDomainAuth.clearAuth();
    } else if (typeof CrossDomainAuth !== 'undefined') {
      // 如果有 CrossDomainAuth 类，创建实例并清除
      try {
        const crossDomainAuth = new CrossDomainAuth();
        crossDomainAuth.clearAuth();
      } catch (e) {
        console.error('Failed to clear auth with CrossDomainAuth:', e);
      }
    }
    
    // 降级方案：清除本地登录状态
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userToken');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    this.updateUI();
    
    // 刷新页面以确保完全清除状态
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }

  // 更新UI显示
  updateUI() {
    const authInfo = document.getElementById('auth-info');
    const loginBtn = document.getElementById('login-btn');
    const userName = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');

    // 如果DOM元素还没有加载，延迟执行
    if ((!authInfo || !loginBtn) && this.retryCount < this.maxRetries) {
      this.retryCount++;
      setTimeout(() => this.updateUI(), 100);
      return;
    }

    // 重置重试计数
    this.retryCount = 0;

    // 如果仍然找不到必要的DOM元素，直接返回
    if (!authInfo || !loginBtn) {
      console.warn('Auth UI elements not found after maximum retries');
      return;
    }

    if (this.currentUser && userName && logoutBtn) {
      // 已登录状态
      authInfo.style.display = 'flex';
      loginBtn.style.display = 'none';
      userName.textContent = this.currentUser.name || this.currentUser.username || this.currentUser.email;
      
      // 绑定登出事件
      logoutBtn.onclick = () => {
        this.logout();
        // 可选：重新加载页面或重定向
        window.location.reload();
      };
    } else {
      // 未登录状态
      authInfo.style.display = 'none';
      loginBtn.style.display = 'inline-block';
    }
  }
}

// 创建全局实例
const authManager = new AuthManager();

// 页面加载时自动初始化
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    authManager.init();
  });
}

export { authManager };