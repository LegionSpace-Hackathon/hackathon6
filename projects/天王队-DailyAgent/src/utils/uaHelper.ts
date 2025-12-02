import * as UAParser from 'ua-parser-js';
/**
 * 用户代理(UA)分析工具
 */

const UA = window.navigator.userAgent;
const LocationSearch = window.location.search;

// 创建简单的事件总线替代 EventEmitter
export const eventBus = {
  events: {} as Record<string, Function[]>,
  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },
  off(event: string, callback: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  },
  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args));
    }
  }
};

/**
 * 当前是 wx|app|m|ipad|pc
 * @returns 设备类型
 */
const uaType = (): string => {
  let isSafari = UA.indexOf("Safari") !== -1 && UA.indexOf("Version") !== -1;
  let isIphone = UA.indexOf("iPhone") !== -1 && UA.indexOf("Version") !== -1;
  
  if (/phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone/i.test(UA)) {
    return 'm';
  } else if (isSafari && !isIphone && 'ontouchend' in document) {
    return 'ipad';
  } else {
    return 'pc';
  }
};

export const getUAType = uaType();

/**
 * 判断是否在应用内
 */
export const isApp = (): boolean => {
  return UA.indexOf('ChainMeet') > -1 || UA.indexOf('Legion') > -1;
};

/**
 * 获取应用内语言环境
 */
export const getAppLanguage = (): string | 0 => {
  return UA.indexOf('en-US') > -1 ? 'en' : UA.indexOf('zh-CH') > -1 ? 'zh-CN' : 0;
};

/**
 * 获取URL查询参数
 * @param queryName 参数名
 * @returns 参数值
 */
export const getQueryValue = (queryName: string): string | null => {
  let query = decodeURI(LocationSearch.substring(1));
  let vars = query.split("&");
  for (let i = 0; i < vars.length; i++) {
    let pair = vars[i].split("=");
    if (pair[0] === queryName) {
      return pair[1];
    }
  }
  return null;
};

/**
 * 检查URL中是否包含指定参数
 * @param paramName 参数名
 * @returns 是否包含该参数
 */
export const hasQueryParam = (paramName: string): boolean => {
  return getQueryValue(paramName) !== null;
};

/**
 * 添加或更新URL参数
 * @param paramName 参数名
 * @param paramValue 参数值
 * @returns 新的URL字符串
 */
export const addOrUpdateQueryParam = (paramName: string, paramValue: string): string => {
  const url = new URL(window.location.href);
  url.searchParams.set(paramName, paramValue);
  return url.toString();
}; 

// 当前是否是 微信
export const IsWeChat = /MicroMessenger/i.test(UA)
//当前是否是  大群应用 (包含桌面端)
export const IsLegion = /ChainMeet/i.test(UA) || /ChainPal/i.test(UA)

// 当前是否是 桌面端 大群应用 (仅桌面端)
export const IsLegionForPc = /ChainPalForPc/i.test(UA)


/**
 * @desc 获取浏览器语言环境
 */
export const navigatorLanguage = (() => {
  if (IsLegion) {
    return UA.indexOf('en-US') > -1 ? 'en' : 'zh'
  }
  if (IsWeChat) {
    return UA.indexOf('Language/en') > -1 ? 'en' : 'zh'
  }
  return navigator.language.indexOf('zh') > -1 ? 'zh' : 'en'
})()


// 初始化解析器（兼容不同打包方式的 UAParser 导出形式）
const getParser = () => {
  // 优先使用navigator.userAgent，为空则尝试从userAgentData补充
  let ua = navigator.userAgent || '';
  if (!ua && (navigator as any).userAgentData?.brands) {
    ua = (navigator as any).userAgentData.brands.map(brand => brand.brand).join(' ');
  }

  // UAParser v2 在不同环境下可能导出为函数或包含类的命名空间
  const UAParserModule: any = UAParser as any;
  const ParserCtor = UAParserModule?.UAParser || UAParserModule;
  return new ParserCtor(ua || '');
};

/**
 * 判断设备品牌（基于ua-parser-js）
 */
const judgeBrand = () => {
  const parser = getParser();
  const device = parser.getDevice(); // 获取设备信息
  const brand = (device.vendor || '').toLowerCase(); // 品牌（如"Huawei"、"OPPO"等）
  const model = (device.model || '').toLowerCase(); // 型号（如"CPH2451"等）

  // 补充品牌识别规则（处理库可能识别不到的情况）
  const brandMap = [
    { key: 'huawei', keywords: ['huawei', 'honor', 'hw-', 'ana-'] },
    { key: 'oppo', keywords: ['oppo', 'oneplus', 'realme', 'cph', 'pg', 'pe', 'rmx', 'coloros'] },
    { key: 'vivo', keywords: ['vivo', 'iqoo', 'v18', 'v19', 'funtouchos'] },
    { key: 'xiaomi', keywords: ['xiaomi', 'redmi', 'mi ', 'mix', 'miui'] }
  ];

  // 优先使用库识别的品牌
  if (brand) {
    for (const item of brandMap) {
      if (item.keywords.some(k => brand.includes(k))) {
        return item.key;
      }
    }
  }

  // 库识别失败时，用型号补充判断
  if (model) {
    for (const item of brandMap) {
      if (item.keywords.some(k => model.includes(k))) {
        return item.key;
      }
    }
  }

  return 'default';
};

/**
 * 获取下载链接（基于品牌和系统）
 */
export const downloadAppUrl = (() => {
  const parser = getParser();
  const os = parser.getOS(); // 获取系统信息
  const isAndroid = os.name?.toLowerCase() === 'android';
  const isWindows = os.name?.toLowerCase() === 'windows';
  const isIOS = ['ios', 'iphone', 'ipad', 'ipod', 'mac os'].includes(os.name?.toLowerCase());
  const brand = judgeBrand();
  if (brand  === 'huawei') {
    return 'https://appgallery.huawei.com/#/app/C114551451';
  }
  // 包含 Windows
  if (isAndroid || isWindows) {
    switch (brand) {
      case 'oppo':
      case 'vivo':
      case 'xiaomi':
        return 'market://details?id=com.tongfudun.legion';
      default:
        return 'https://dappstore.tongfudun.com/user/Detail_mobile/30017dc426f87b5e'; // 安卓默认APK下载
    }
  } else  {
    return 'https://apps.apple.com/cn/app/id6747742179';
  }

})();