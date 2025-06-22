// 共享Header加载器
class HeaderLoader {
  constructor() {
    this.currentPage = this.getCurrentPageName();
  }

  // 获取当前页面名称
  getCurrentPageName() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return 'index';
    if (path.includes('new-meetup')) return 'new-meetup';
    if (path.includes('my-meetups')) return 'my-meetups';
    if (path.includes('meetup-manage')) return 'meetup-manage';
    if (path.includes('admin')) return 'admin';
    if (path.includes('meetup.html') || path.includes('meetup?')) return 'meetup';
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

  // 初始化
  async init() {
    await this.loadHeader();
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