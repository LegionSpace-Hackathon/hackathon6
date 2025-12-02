/**
 * 工具类索引文件
 * 统一导出所有工具类
 */
const UA: string = window.navigator.userAgent
import Config from '../../config';
import { callNativeMethods, callUrlScheme } from './chainpal-utils-0.0.4';
export * from './uaHelper';

// 添加更多工具函数导出...

/**
 * 判断是否是移动设备
 * @returns {boolean} 是否是移动设备
 */
export function isMobile() {
  const UA = navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(UA);
}

/**
 * 获取 URL 参数
 * @param name 参数名
 * @returns 参数值
 */
export function getQueryParam(name: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 格式化数字，添加千位分隔符
 * @param num 数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 深拷贝
 * @param obj 要拷贝的对象
 * @returns 拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(deepClone) as unknown as T;
  }
  
  const result = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deepClone(obj[key]);
    }
  }
  return result;
}

/**
 * 获取当前用户ID
 * @returns string 用户ID，如果不存在则返回'0'
 */
export const getUserId = (): string => {
  const userId = localStorage.getItem('userId') || '0';
  if (!userId) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('未找到用户ID');
    }
    return '0';
  }
  return userId;
};

/**
 * 格式化日期时间
 * @param timestamp 时间戳
 * @param format 格式化模式，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export const formatDate = (timestamp: number, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!timestamp) return '—';
  
  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) {
    return '—';
  }
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}; 

export const isApp: boolean = UA.indexOf('ChainMeet') > -1;

/**
 * 获取ChainMeet应用的授权Token
 * @returns Promise<string> 授权Token
 */
export const getAppAuthToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 如果不在App环境中，直接返回空
    if (!isApp) {
      reject('不在ChainMeet应用环境中');
      return;
    }

    try {
      callNativeMethods(
        'LightApplication',
        { appid: Config.APP_ID },
        (resJson: string) => {
          try {
            const { transactionCode, code } = JSON.parse(resJson);
            if (code && transactionCode) {
              resolve(transactionCode);
            } else {
              reject('获取授权Token失败');
            }
          } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
              console.error('解析授权Token失败:', error);
            }
            reject('解析授权Token失败');
          }
        }
      );
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('获取授权Token失败:', error);
      }
      reject('获取授权Token失败');
    }
  });
};


export function openWindowWithChianPal(url: string) {
  if (window.navigator.userAgent.indexOf('ChainMeet') != -1) {
    let domain = url.startsWith('http') ? '' : location.host
    let pre = url.startsWith('http') ? '' : domain.search('localhost:3000') != -1 || domain.search('192.168.') != -1 ? 'http://' : 'https://'
    callNativeMethods('OpenNewPage', { url: pre + domain + url })
  } else {
    let domain = url.startsWith('http') ? '' : location.host
    let pre = url.startsWith('http') ? '' : domain.search('localhost:3000') != -1 || domain.search('192.168.') != -1 ? 'http://' : 'https://'
    window.open(pre + domain + url)
  }
}

// 对手机号以及其他敏感信息进行加密 根据传参决定加密个数 
export const encryptSensitiveInfo = (info: string, count: number = 3, endCount: number = 4) => {
  return info.replace(/(\d{3})\d+(\d{4})/, '$1****$2');
}

/**
 * 将 contentEditable 元素的内容转换为纯文本（保留换行符和空格）
 * @param element contentEditable 的 HTMLElement
 * @returns 转换后的纯文本，换行符会被保留
 */
export const contentEditableToText = (element: HTMLElement): string => {
  if (!element) return '';
  
  // 使用 innerText 来获取文本，它会保留换行符和空格
  // innerText 会将 <br> 和 <div> 等块级元素转换为换行符
  let text = element.innerText || '';
  
  // 如果 innerText 不可用，则使用 textContent 作为备选
  if (!text && element.textContent) {
    text = element.textContent;
  }
  
  // 规范化换行符：统一将 \r\n 和 \r 转换为 \n
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // 不压缩换行符，保留所有用户输入的换行
  // 这样可以确保用户按多少次回车，就能创建多少个换行
  // 只在真正需要时才压缩（比如超过10个的连续换行符，可能是异常情况）
  text = text.replace(/\n{11,}/g, '\n'.repeat(10));
  
  return text;
};

/**
 * 将包含换行符的文本转换为适合 contentEditable 显示的格式
 * @param text 包含换行符的纯文本
 * @returns 转换后的文本（用于设置 textContent）
 */
export const textToContentEditable = (text: string): string => {
  if (!text) return '';
  
  // 直接返回原文本，让 textContent 处理
  // 由于 CSS 设置了 white-space: pre-wrap，\n 会被正确显示为换行
  return text;
};

/**
 * 将文本中的换行符转换为转义字符（用于传输给后端）
 * @param text 原始文本
 * @returns 转义后的文本
 */
export const escapeNewlines = (text: string): string => {
  if (!text) return '';
  
  // 将实际的换行符替换为转义的 \n
  // 注意：这里不是字面上的反斜杠n，而是实际的换行符
  return text;
};

/**
 * 将转义的换行符转换为实际的换行符（从后端接收数据时使用）
 * @param text 包含转义换行符的文本
 * @returns 解析后的文本
 */
export const unescapeNewlines = (text: string): string => {
  if (!text) return '';
  
  // JSON.parse 会自动处理 \n \r\n 等转义字符
  // 但如果文本已经是正常的换行符，则直接返回
  return text;
};
