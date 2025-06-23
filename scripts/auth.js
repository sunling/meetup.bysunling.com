/**
 * 统一认证管理脚本
 * 处理所有页面的登录状态检查、用户信息获取和退出登录功能
 */

class UnifiedAuth {
  constructor() {
    this.crossDomainAuth = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * 初始化认证系统
   */
  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  async _doInit() {
    if (this.isInitialized) {
      return;
    }

    // 等待 CrossDomainAuth 加载完成
    await this.waitForCrossDomainAuth();
    
    // 初始化 crossDomainAuth 实例
    if (window.crossDomainAuth) {
      this.crossDomainAuth = window.crossDomainAuth;
    } else if (typeof CrossDomainAuth !== 'undefined') {
      this.crossDomainAuth = new CrossDomainAuth();
    }

    this.isInitialized = true;
  }

  /**
   * 等待 CrossDomainAuth 加载完成
   */
  async waitForCrossDomainAuth(maxWait = 3000) {
    const startTime = Date.now();
    while (!window.crossDomainAuth && !window.CrossDomainAuth && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // 简短等待确保初始化完成
    if (window.crossDomainAuth || window.CrossDomainAuth) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser() {
    await this.init();

    try {
      // 优先使用 crossDomainAuth
      if (this.crossDomainAuth) {
        const token = this.crossDomainAuth.getToken();
        const user = this.crossDomainAuth.getUser();
        
        if (token && user) {
          return { ...user, authToken: token };
        }
      }

      // 降级到 localStorage
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          return { ...user, authToken: token };
        } catch (e) {
          console.warn('Failed to parse user from localStorage:', e);
          // 清除损坏的数据
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * 检查是否已登录
   */
  async isLoggedIn() {
    const user = await this.getCurrentUser();
    return !!user;
  }

  /**
   * 保存认证信息
   */
  async saveAuth(token, userData) {
    await this.init();

    try {
      // 优先使用 crossDomainAuth
      if (this.crossDomainAuth && token) {
        this.crossDomainAuth.saveAuth(token, userData);
      }

      // 同时保存到 localStorage 作为降级方案
      if (token) {
        localStorage.setItem('authToken', token);
      }
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Failed to save auth:', error);
    }
  }

  /**
   * 清除认证信息（退出登录）
   */
  async clearAuth() {
    await this.init();

    try {
      // 使用 crossDomainAuth 清除
      if (this.crossDomainAuth) {
        this.crossDomainAuth.clearAuth();
      }

      // 清除 localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userToken');
      localStorage.removeItem('isAdmin');
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }

  /**
   * 退出登录并刷新页面
   */
  async logout() {
    await this.clearAuth();
    
    // 延迟刷新页面，确保清除操作完成
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }

  /**
   * 检查并更新页面的认证状态UI
   */
  async checkAndUpdateAuthUI() {
    const user = await this.getCurrentUser();
    
    // 查找页面中的认证相关元素
    const authInfo = document.getElementById('auth-info');
    const loginBtn = document.getElementById('login-btn');
    const userNameSpan = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');

    if (user) {
      // 已登录状态
      if (authInfo) authInfo.style.display = 'flex';
      if (loginBtn) loginBtn.style.display = 'none';
      if (userNameSpan) userNameSpan.textContent = user.username || user.email || '用户';
      
      // 绑定退出登录事件
      if (logoutBtn && !logoutBtn.hasAttribute('data-logout-bound')) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.logout();
        });
        logoutBtn.setAttribute('data-logout-bound', 'true');
      }
    } else {
      // 未登录状态
      if (authInfo) authInfo.style.display = 'none';
      if (loginBtn) loginBtn.style.display = 'inline-block';
    }

    return user;
  }

  /**
   * 监听认证状态变化
   */
  setupAuthListener() {
    // 监听 localStorage 变化（用于多标签页同步）
    window.addEventListener('storage', (e) => {
      if (e.key === 'authToken' || e.key === 'user') {
        this.checkAndUpdateAuthUI();
      }
    });

    // 监听页面可见性变化，当页面重新可见时检查认证状态
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // 页面重新可见时，简短延迟后检查认证状态
        setTimeout(() => {
          this.checkAndUpdateAuthUI();
        }, 200);
      }
    });
  }

  /**
   * 检查URL参数，处理登录回调
   */
  checkLoginCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userInfo = urlParams.get('user');
    const loginSuccess = urlParams.get('login');
    
    // 处理带token和user参数的回调（类似cards.bysunling.com）
    if (token && userInfo) {
      try {
        // 解码用户信息
        const user = JSON.parse(decodeURIComponent(userInfo));
        
        // 保存认证信息
        this.saveAuth(token, user);
        
        // 清除URL参数
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // 立即更新UI
        this.checkAndUpdateAuthUI();
        
        console.log('登录成功，欢迎回来！');
        return;
      } catch (error) {
        console.error('处理登录回调失败:', error);
      }
    }
    
    // 处理login=success参数的回调
    if (loginSuccess === 'success') {
      // 登录成功回调，清理URL参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // 延迟检查认证状态
      setTimeout(() => {
        this.checkAndUpdateAuthUI();
      }, 500);
    }
  }

  /**
   * 自动初始化页面认证状态
   */
  async autoInit() {
    await this.init();
    
    // 检查登录回调
    this.checkLoginCallback();
    
    // 检查并更新UI
    await this.checkAndUpdateAuthUI();
    
    // 设置监听器
    this.setupAuthListener();
  }
}

// 创建全局实例
const unifiedAuth = new UnifiedAuth();

// 兼容性：提供全局函数
window.checkAuthStatus = () => unifiedAuth.checkAndUpdateAuthUI();
window.logout = () => unifiedAuth.logout();
window.getCurrentUser = () => unifiedAuth.getCurrentUser();
window.isLoggedIn = () => unifiedAuth.isLoggedIn();

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    unifiedAuth.autoInit();
  });
} else {
  // 如果页面已经加载完成，立即初始化
  unifiedAuth.autoInit();
}

// 导出实例供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = unifiedAuth;
}

if (typeof window !== 'undefined') {
  window.unifiedAuth = unifiedAuth;
}

export default unifiedAuth;
export { unifiedAuth };