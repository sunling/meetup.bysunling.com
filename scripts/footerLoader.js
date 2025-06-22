class FooterLoader {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadSharedFooter();
  }

  async loadSharedFooter() {
    try {
      const response = await fetch('./shared-footer.html');
      const footerHtml = await response.text();
      
      const footerContainer = document.getElementById('shared-footer-container');
      if (footerContainer) {
        footerContainer.innerHTML = footerHtml;
      }
    } catch (error) {
      console.error('Failed to load shared footer:', error);
    }
  }
}

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new FooterLoader();
});

export { FooterLoader };