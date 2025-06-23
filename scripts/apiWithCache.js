/**
 * API调用包装器 - 集成缓存功能
 * 减少对Netlify Functions和数据库的调用压力
 */

import { cacheManager } from './cacheManager.js';

class ApiWithCache {
  constructor() {
    this.baseUrl = window.location.origin;
  }

  /**
   * 通用API调用方法
   */
  async apiCall(url, options = {}) {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 获取活动列表（带缓存）
   */
  async getMeetups() {
    return cacheManager.withCache(
      'meetups',
      () => this.apiCall(`${this.baseUrl}/.netlify/functions/listMeetups`)
    );
  }

  /**
   * 获取活动详情（带缓存）
   */
  async getMeetupDetails(id, token = null) {
    const params = { id, ...(token && { token }) };
    const queryString = new URLSearchParams(params).toString();
    
    return cacheManager.withCache(
      'meetupDetails',
      () => this.apiCall(`${this.baseUrl}/.netlify/functions/getMeetupDetails?${queryString}`),
      params
    );
  }

  /**
   * 获取所有活动（管理员用，带缓存）
   */
  async getAllMeetups() {
    return cacheManager.withCache(
      'allMeetups',
      () => this.apiCall(`${this.baseUrl}/.netlify/functions/listAllMeetups`)
    );
  }

  /**
   * 创建活动（清除相关缓存）
   */
  async createMeetup(meetupData) {
    const result = await this.apiCall(`${this.baseUrl}/.netlify/functions/createMeetup`, {
      method: 'POST',
      body: JSON.stringify(meetupData)
    });

    // 清除相关缓存
    cacheManager.delete('meetups');
    cacheManager.delete('allMeetups');
    
    return result;
  }

  /**
   * 更新活动（清除相关缓存）
   */
  async updateMeetup(token, meetupData) {
    const result = await this.apiCall(`${this.baseUrl}/.netlify/functions/updateMeetup`, {
      method: 'POST',
      body: JSON.stringify({ token, ...meetupData })
    });

    // 清除相关缓存
    cacheManager.delete('meetups');
    cacheManager.delete('allMeetups');
    cacheManager.delete('meetupDetails', { token });
    if (meetupData.id) {
      cacheManager.delete('meetupDetails', { id: meetupData.id });
    }
    
    return result;
  }

  /**
   * 提交RSVP（清除相关缓存）
   */
  async submitRsvp(rsvpData) {
    const result = await this.apiCall(`${this.baseUrl}/.netlify/functions/submitRsvp`, {
      method: 'POST',
      body: JSON.stringify(rsvpData)
    });

    // 清除相关缓存
    cacheManager.delete('meetups');
    cacheManager.delete('meetupDetails', { id: rsvpData.meetup_id });
    cacheManager.delete('rsvpCounts', { meetup_id: rsvpData.meetup_id });
    // 清除用户RSVP缓存
    if (rsvpData.username) {
      cacheManager.delete('userRsvps', { username: rsvpData.username });
      cacheManager.delete('userRsvps', { username: rsvpData.username, status: rsvpData.status });
    }
    
    return result;
  }

  /**
   * 删除RSVP（清除相关缓存）
   */
  async deleteRsvp(meetupId, name, wechatId, username = null) {
    const result = await this.apiCall(`${this.baseUrl}/.netlify/functions/deleteRsvp`, {
      method: 'POST',
      body: JSON.stringify({ meetup_id: meetupId, name, wechat_id: wechatId })
    });

    // 清除相关缓存
    cacheManager.delete('meetups');
    cacheManager.delete('meetupDetails', { id: meetupId });
    cacheManager.delete('rsvpCounts', { meetup_id: meetupId });
    // 清除用户RSVP缓存
    if (username) {
      cacheManager.delete('userRsvps', { username });
      cacheManager.delete('userRsvps', { username, status: 'going' });
      cacheManager.delete('userRsvps', { username, status: 'maybe' });
    }
    
    return result;
  }

  /**
   * 审核活动（清除相关缓存）
   */
  async approveMeetup(meetupId, status) {
    const result = await this.apiCall(`${this.baseUrl}/.netlify/functions/approveMeetup`, {
      method: 'POST',
      body: JSON.stringify({ meetup_id: meetupId, status })
    });

    // 清除相关缓存
    cacheManager.delete('meetups');
    cacheManager.delete('allMeetups');
    cacheManager.delete('meetupDetails', { id: meetupId });
    
    return result;
  }

  /**
   * 上传图片到GitHub
   */
  async uploadImageToGitHub(imageData) {
    // 图片上传不需要缓存，直接调用
    return this.apiCall(`${this.baseUrl}/.netlify/functions/uploadImageToGitHub`, {
      method: 'POST',
      body: JSON.stringify(imageData)
    });
  }

  /**
   * 智能获取活动列表（优先返回缓存，后台更新）
   */
  async getMeetupsSmartRefresh() {
    return cacheManager.smartRefresh(
      'meetups',
      () => this.apiCall(`${this.baseUrl}/.netlify/functions/listMeetups`)
    );
  }

  async getUserMeetups(creator) {
    if (!creator) {
      throw new Error('Creator parameter is required');
    }
    
    const queryString = new URLSearchParams({ creator }).toString();
    return cacheManager.withCache(
      'userMeetups',
      () => this.apiCall(`${this.baseUrl}/.netlify/functions/getUserMeetups?${queryString}`),
      { creator }
    );
  }

  /**
   * 获取用户的RSVP记录（感兴趣和已报名的活动）
   */
  async getUserRsvps(username, status = null) {
    if (!username) {
      throw new Error('Username parameter is required');
    }
    
    const params = { username };
    if (status) {
      params.status = status;
    }
    
    const queryString = new URLSearchParams(params).toString();
    return cacheManager.withCache(
      'userRsvps',
      () => this.apiCall(`${this.baseUrl}/.netlify/functions/getUserRsvps?${queryString}`),
      params
    );
  }

  /**
   * 获取用户感兴趣的活动
   */
  async getUserInterestedMeetups(username) {
    return this.getUserRsvps(username, 'maybe');
  }

  /**
   * 获取用户已报名的活动
   */
  async getUserRegisteredMeetups(username) {
    return this.getUserRsvps(username, 'going');
  }

  /**
   * 预加载常用数据
   */
  async preloadCommonData() {
    const tasks = [
      {
        type: 'meetups',
        apiCall: () => this.apiCall(`${this.baseUrl}/.netlify/functions/listMeetups`)
      }
    ];

    await cacheManager.preload(tasks);
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const memorySize = cacheManager.memoryCache.size;
    let localStorageSize = 0;
    
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage);
      localStorageSize = keys.filter(key => key.startsWith('cache_')).length;
    }

    return {
      memoryCache: memorySize,
      localStorage: localStorageSize,
      total: memorySize + localStorageSize
    };
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    cacheManager.clear();
    console.log('所有缓存已清除');
  }
}

// 创建全局API实例
const apiWithCache = new ApiWithCache();

// 页面加载时预加载常用数据
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // 延迟预加载，避免阻塞页面渲染
    setTimeout(() => {
      apiWithCache.preloadCommonData().catch(error => {
        console.warn('预加载数据失败:', error);
      });
    }, 1000);
  });
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiWithCache, apiWithCache };
} else if (typeof window !== 'undefined') {
  window.ApiWithCache = ApiWithCache;
  window.apiWithCache = apiWithCache;
}

export { ApiWithCache, apiWithCache };