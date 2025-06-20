/**
 * 缓存管理器 - 减少数据库和API调用压力
 * 支持内存缓存和浏览器本地存储缓存
 */

class CacheManager {
    constructor() {
        this.memoryCache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5分钟默认过期时间
        this.config = {
            // 不同数据类型的缓存配置
            meetups: { ttl: 1 * 60 * 1000, storage: 'localStorage' }, // 1分钟，活动列表变化较频繁
            meetupDetails: { ttl: 5 * 60 * 1000, storage: 'localStorage' }, // 5分钟，详情相对稳定
            rsvpCounts: { ttl: 1 * 60 * 1000, storage: 'memory' }, // 1分钟，报名数据变化频繁
            userRsvp: { ttl: 10 * 60 * 1000, storage: 'localStorage' }, // 10分钟，用户报名状态
        };
    }

    /**
     * 生成缓存键
     */
    generateKey(type, params = {}) {
        const paramStr = Object.keys(params)
            .sort()
            .map(key => `${key}:${params[key]}`)
            .join('|');
        return `${type}${paramStr ? `_${paramStr}` : ''}`;
    }

    /**
     * 设置缓存
     */
    set(type, data, params = {}) {
        const config = this.config[type] || { ttl: this.defaultTTL, storage: 'memory' };
        const key = this.generateKey(type, params);
        const expiry = Date.now() + config.ttl;
        const cacheItem = { data, expiry };

        if (config.storage === 'localStorage' && typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
            } catch (e) {
                console.warn('localStorage缓存失败，使用内存缓存:', e);
                this.memoryCache.set(key, cacheItem);
            }
        } else {
            this.memoryCache.set(key, cacheItem);
        }
    }

    /**
     * 获取缓存
     */
    get(type, params = {}) {
        const config = this.config[type] || { ttl: this.defaultTTL, storage: 'memory' };
        const key = this.generateKey(type, params);
        let cacheItem = null;

        if (config.storage === 'localStorage' && typeof localStorage !== 'undefined') {
            try {
                const stored = localStorage.getItem(`cache_${key}`);
                if (stored) {
                    cacheItem = JSON.parse(stored);
                }
            } catch (e) {
                console.warn('localStorage读取失败:', e);
            }
        }

        if (!cacheItem) {
            cacheItem = this.memoryCache.get(key);
        }

        if (!cacheItem) {
            return null;
        }

        // 检查是否过期
        if (Date.now() > cacheItem.expiry) {
            this.delete(type, params);
            return null;
        }

        return cacheItem.data;
    }

    /**
     * 删除缓存
     */
    delete(type, params = {}) {
        const config = this.config[type] || { storage: 'memory' };
        const key = this.generateKey(type, params);

        if (config.storage === 'localStorage' && typeof localStorage !== 'undefined') {
            localStorage.removeItem(`cache_${key}`);
        }
        this.memoryCache.delete(key);
    }

    /**
     * 清除所有缓存
     */
    clear() {
        this.memoryCache.clear();
        if (typeof localStorage !== 'undefined') {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('cache_')) {
                    localStorage.removeItem(key);
                }
            });
        }
    }

    /**
     * 清除过期缓存
     */
    clearExpired() {
        const now = Date.now();

        // 清理内存缓存
        for (const [key, item] of this.memoryCache.entries()) {
            if (now > item.expiry) {
                this.memoryCache.delete(key);
            }
        }

        // 清理localStorage缓存
        if (typeof localStorage !== 'undefined') {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('cache_')) {
                    try {
                        const item = JSON.parse(localStorage.getItem(key));
                        if (now > item.expiry) {
                            localStorage.removeItem(key);
                        }
                    } catch (e) {
                        localStorage.removeItem(key); // 删除损坏的缓存项
                    }
                }
            });
        }
    }

    /**
     * 缓存装饰器 - 用于包装API调用
     */
    async withCache(type, apiCall, params = {}) {
        // 先尝试从缓存获取
        const cached = this.get(type, params);
        if (cached) {
            console.log(`缓存命中: ${type}`, params);
            return cached;
        }

        // 缓存未命中，调用API
        console.log(`缓存未命中，调用API: ${type}`, params);
        try {
            const result = await apiCall();
            // 将结果存入缓存
            this.set(type, result, params);
            return result;
        } catch (error) {
            console.error(`API调用失败: ${type}`, error);
            throw error;
        }
    }

    /**
     * 智能刷新 - 在后台更新缓存
     */
    async smartRefresh(type, apiCall, params = {}) {
        const cached = this.get(type, params);

        if (cached) {
            // 检查缓存是否过期，只有过期时才后台更新
            const cacheKey = this.generateKey(type, params);
            const cacheData = this.storage === 'localStorage'
                ? JSON.parse(localStorage.getItem(cacheKey) || 'null')
                : this.memoryCache.get(cacheKey);

            if (cacheData && Date.now() - cacheData.timestamp > this.ttl) {
                // 缓存已过期，进行后台更新
                setTimeout(async () => {
                    try {
                        const fresh = await apiCall();
                        this.set(type, fresh, params);
                        console.log(`后台更新缓存完成: ${type}`, params);
                    } catch (error) {
                        console.warn(`后台更新缓存失败: ${type}`, error);
                    }
                }, 0);
            }
            return cached;
        } else {
            // 无缓存时，正常调用API
            return this.withCache(type, apiCall, params);
        }
    }

    /**
     * 批量预加载缓存
     */
    async preload(tasks) {
        const promises = tasks.map(async ({ type, apiCall, params }) => {
            try {
                await this.withCache(type, apiCall, params);
            } catch (error) {
                console.warn(`预加载失败: ${type}`, error);
            }
        });

        await Promise.allSettled(promises);
        console.log('缓存预加载完成');
    }
}

// 创建全局缓存实例
const cacheManager = new CacheManager();

// 定期清理过期缓存
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        cacheManager.clearExpired();
    }, 10 * 60 * 1000); // 每10分钟清理一次
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CacheManager, cacheManager };
} else if (typeof window !== 'undefined') {
    window.CacheManager = CacheManager;
    window.cacheManager = cacheManager;
}

export { CacheManager, cacheManager };