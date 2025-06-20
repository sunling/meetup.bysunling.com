/**
 * 将用户输入的本地时间转换为UTC时间戳用于数据库存储
 * @param {Object|string} datetime - 时间对象或字符串
 * @param {string} datetime.localTime - 本地时间字符串 (YYYY-MM-DDTHH:mm)
 * @param {string} datetime.timezone - 时区信息
 * @returns {string} UTC时间戳字符串 (ISO格式)
 */
function formatDateTimeForStorage(datetime) {
  if (typeof datetime === 'object' && datetime !== null && datetime.localTime) {
    const timezone = datetime.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    try {
      const localTimeStr = datetime.localTime;
      
      // 验证时间格式
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localTimeStr)) {
        throw new Error(`Invalid local time format: ${localTimeStr}`);
      }
      
      // 使用正确的方法：将本地时间字符串当作指定时区的时间来解析
      // 方法：创建一个假设的UTC时间，然后通过时区转换找到真正的UTC时间
      
      const [datePart, timePart] = localTimeStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);
      
      // 创建两个时间点来计算偏移量
      // 1. 假设这个时间就是UTC时间
      const assumedUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
      
      // 2. 看看这个UTC时间在目标时区显示为什么时间
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const timeInTargetZone = formatter.format(assumedUtc);
      const targetDate = new Date(timeInTargetZone + 'Z'); // 当作UTC解析
      
      // 3. 计算偏移量并应用
      const offset = assumedUtc.getTime() - targetDate.getTime();
      const correctUtc = new Date(assumedUtc.getTime() + offset);
      
      console.log(`Local time: ${localTimeStr} in ${timezone}`);
      console.log(`Assumed UTC: ${assumedUtc.toISOString()}`);
      console.log(`Time in target zone: ${timeInTargetZone}`);
      console.log(`Offset: ${offset / 60000} minutes`);
      console.log(`Correct UTC: ${correctUtc.toISOString()}`);
      
      return correctUtc.toISOString();
      
    } catch (error) {
      console.error('Error converting datetime:', error);
      throw new Error(`Failed to convert datetime: ${error.message}`);
    }
  } else {
    // 旧格式的回退处理: 当作本地时间处理，转换为UTC
    try {
      const date = new Date(datetime);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid datetime value: ${datetime}`);
      }
      return date.toISOString();
    } catch (error) {
      console.error('Error in formatDateTimeForStorage:', error);
      throw new Error(`Invalid datetime format: ${datetime}`);
    }
  }
}

/**
 * 格式化数据库中的时间戳用于页面显示
 * @param {string} datetimeString - 数据库中的时间戳字符串
 * @returns {string} 格式化后的本地时间显示字符串
 */
function formatDateTimeForDisplay(datetimeString) {
  if (!datetimeString) return '';

  const date = new Date(datetimeString);

  // 获取本地时间格式
  const localDateString = date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const localTimeString = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return `${localDateString} ${localTimeString}`;
}

/**
 * 将数据库时间戳转换为datetime-local输入框的格式
 * @param {string} datetimeString - 数据库中的时间戳字符串
 * @returns {string} YYYY-MM-DDTHH:mm 格式的字符串
 */
function formatDateTimeForInput(datetimeString) {
  if (!datetimeString) return '';

  const date = new Date(datetimeString);

  // 手动构造 YYYY-MM-DDTHH:mm 格式
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 获取当前用户的时区信息
 * @returns {string} 用户的时区字符串
 */
function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * 创建包含本地时间和时区信息的对象
 * @param {string} localTimeString - 本地时间字符串 (YYYY-MM-DDTHH:mm)
 * @returns {Object} 包含localTime和timezone的对象
 */
function createDateTimeObject(localTimeString) {
  return {
    localTime: localTimeString,
    timezone: getUserTimezone()
  };
}

/**
 * 从日期时间字符串生成本地日期键，避免时区转换问题
 * @param {string} datetimeString - 日期时间字符串
 * @returns {string} YYYY-MM-DD 格式的日期键
 */
function getLocalDateKey(datetimeString) {
  const date = new Date(datetimeString);

  // 使用本地时间而不是UTC时间来生成日期键
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// 如果在Node.js环境中，导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatDateTimeForStorage,
    formatDateTimeForDisplay,
    formatDateTimeForInput,
    getUserTimezone,
    createDateTimeObject,
    getLocalDateKey
  };
}

// 如果在浏览器环境中，将函数添加到全局对象
if (typeof window !== 'undefined') {
  window.TimeUtils = {
    formatDateTimeForStorage,
    formatDateTimeForDisplay,
    formatDateTimeForInput,
    getUserTimezone,
    createDateTimeObject,
    getLocalDateKey
  };
}