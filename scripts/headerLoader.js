// 共享Header加载器
class HeaderLoader {
  constructor() {
    this.currentPage = this.getCurrentPageName();
  }

  // 获取当前页面名称
  getCurrentPageName() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html' || path === '/index') return 'index';
    if (path.includes('new-meetup')) return 'new-meetup';
    if (path.includes('my-meetups')) return 'my-meetups';
    if (path.includes('manage')) return 'manage';
    if (path.includes('admin')) return 'admin';
    if (path.includes('meetup.html') || path.includes('meetup?') || path.includes('meetup') && !path.includes('meetup-') && !path.includes('my-meetup')) return 'meetup';
    return '';
  }

  // 加载共享header
  async loadHeader() {
    try {
      const response = await fetch('/shared-header.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const headerHtml = await response.text();
      
      // 查找header容器并插入内容
      const headerContainer = document.getElementById('shared-header-container');
      if (headerContainer) {
        headerContainer.innerHTML = headerHtml;
        this.setActiveNavLink();
        this.updateLoginRedirect();
      } else {
        console.error('Header container not found');
      }
    } catch (error) {
      console.error('Failed to load shared header:', error);
    }
  }

  // 设置当前页面的导航链接为激活状态
  setActiveNavLink() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      const pageName = link.getAttribute('data-page');
      if (pageName === this.currentPage) {
        link.classList.add('active');
      }
    });
  }

  // 更新登录链接的重定向URL
  updateLoginRedirect() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      const currentUrl = window.location.href;
      const redirectUrl = `https://bysunling.com/auth?redirect=${encodeURIComponent(currentUrl)}`;
      loginBtn.href = redirectUrl;
    }
  }

  // 初始化用户下拉菜单交互
  initUserDropdown() {
    const dropdownToggle = document.getElementById('user-dropdown-toggle');
    const dropdown = document.querySelector('.user-dropdown');
    const dropdownMenu = document.getElementById('user-dropdown-menu');

    if (dropdownToggle && dropdown) {
      // 点击切换下拉菜单
      dropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
      });

      // 点击页面其他地方关闭下拉菜单
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('active');
        }
      });

      // 阻止下拉菜单内部点击事件冒泡
      if (dropdownMenu) {
        dropdownMenu.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }
    }
  }

  // 等待统一认证系统加载
  async waitForUnifiedAuth(maxWait = 3000) {
    const startTime = Date.now();
    while (!window.unifiedAuth && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // 根据用户状态更新导航显示
  async updateNavForUserStatus() {
    // 等待统一认证系统加载
    await this.waitForUnifiedAuth();
    
    // 检查用户登录状态 - 使用统一认证系统
    let isLoggedIn = false;
    
    // 优先使用统一认证系统检查
    if (window.unifiedAuth) {
      try {
        isLoggedIn = await window.unifiedAuth.isLoggedIn();
      } catch (error) {
        console.warn('Failed to check login status with unifiedAuth:', error);
        // 降级到localStorage检查
        isLoggedIn = !!(localStorage.getItem('authToken') || localStorage.getItem('userToken'));
      }
    } else {
      // 降级方案：检查多种可能的token存储
      isLoggedIn = !!(localStorage.getItem('authToken') || 
                     localStorage.getItem('userToken') || 
                     new URLSearchParams(window.location.search).get('token'));
    }
    
    // 检查管理员权限
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    // 显示/隐藏访客专属导航（未登录用户）
    const guestOnlyLinks = document.querySelectorAll('.guest-only');
    guestOnlyLinks.forEach(link => {
      link.style.display = isLoggedIn ? 'none' : 'block';
    });
    
    // 显示/隐藏用户专属导航
    const userOnlyLinks = document.querySelectorAll('.user-only');
    userOnlyLinks.forEach(link => {
      link.style.display = isLoggedIn ? 'block' : 'none';
    });
    
    // 显示/隐藏管理员专属导航
    const adminOnlyLinks = document.querySelectorAll('.admin-only');
    adminOnlyLinks.forEach(link => {
      link.style.display = isAdmin ? 'block' : 'none';
    });
  }

  // 初始化
  async init() {
    await this.loadHeader();
    await this.updateNavForUserStatus();
    this.initUserDropdown();
    
    // 监听localStorage变化，动态更新导航
    window.addEventListener('storage', () => {
      this.updateNavForUserStatus();
    });
    
    // 等待统一认证系统加载后设置监听器
    await this.waitForUnifiedAuth();
    if (window.unifiedAuth) {
      // 监听认证状态变化
      const checkAuthChange = async () => {
        await this.updateNavForUserStatus();
      };
      
      // 监听页面可见性变化
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          setTimeout(checkAuthChange, 200);
        }
      });
      
      // 定期检查认证状态变化（降低频率）
      setInterval(checkAuthChange, 2000);
    }
  }
}

// 创建全局实例
const headerLoader = new HeaderLoader();

// 页面加载时自动初始化
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    headerLoader.init();
  });
}

export { headerLoader };