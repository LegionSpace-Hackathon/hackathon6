/**
 * 分享对话相关工具函数
 *
 * 功能包括：
 * - 用户ID加密/解密
 * - 分享链接生成
 * - 分享权限验证
 *
 * @author Space Front Team
 * @version 1.0.0
 */

import CryptoJS from 'crypto-js';

// 加密密钥 - 在实际项目中应该从环境变量或配置文件中获取
const ENCRYPTION_KEY = 'SpaceFront2024ShareKey';

/**
 * 加密用户ID
 * @param userId 用户ID
 * @returns 加密后的字符串
 */
export const encryptUserId = (userId: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(userId, ENCRYPTION_KEY).toString();
    // 使用base64url编码，使其在URL中安全传输
    return btoa(encrypted).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (error) {
    console.error('用户ID加密失败:', error);
    throw new Error('用户ID加密失败');
  }
};

/**
 * 解密用户ID
 * @param encryptedUserId 加密的用户ID
 * @returns 解密后的用户ID
 */
export const decryptUserId = (encryptedUserId: string): string => {
  try {
    // 还原base64url编码
    let base64 = encryptedUserId.replace(/-/g, '+').replace(/_/g, '/');
    // 补全padding
    while (base64.length % 4) {
      base64 += '=';
    }

    const encrypted = atob(base64);
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    const userId = decrypted.toString(CryptoJS.enc.Utf8);

    if (!userId) {
      throw new Error('解密结果为空');
    }

    return userId;
  } catch (error) {
    console.error('用户ID解密失败:', error);
    throw new Error('用户ID解密失败');
  }
};

/**
 * 生成分享链接
 * @param agentId 智能体ID（仅原路径使用）
 * @param conversationId 会话ID
 * @param userId 用户ID
 * @returns 分享链接
 */
export const generateShareUrl = (
  agentId: string,
  conversationId: string,
  userId: string
): string => {
  try {
    const encryptedUserId = encryptUserId(userId);
    const baseUrl = window.location.origin;
    
    // 检查当前路径类型 - 使用更精确的检测
    const currentPath = window.location.pathname;
    const isNewPath = currentPath.includes('/agent-orchestration/');
    
    console.log('=== 分享URL生成调试信息 ===');
    console.log('当前路径:', currentPath);
    console.log('是否为新路径:', isNewPath);
    console.log('传入的agentId:', agentId);
    console.log('conversationId:', conversationId);
    console.log('userId:', userId);
    
    let shareUrl: string;
    if (isNewPath) {
      // 新路径：保持当前路径结构，不使用agentId参数
      shareUrl = `${baseUrl}${currentPath}?conversation=${conversationId}&shareUserId=${encryptedUserId}&isShared=true&hasHistory=true`;
      console.log('生成新路径分享链接:', shareUrl);
    } else {
      // 原路径：使用原有的URL结构，需要agentId参数
      shareUrl = `${baseUrl}/agent?id=${agentId}&conversation=${conversationId}&shareUserId=${encryptedUserId}&isShared=true&hasHistory=true`;
      console.log('生成原路径分享链接:', shareUrl);
    }

    return shareUrl;
  } catch (error) {
    console.error('生成分享链接失败:', error);
    throw new Error('生成分享链接失败');
  }
};

/**
 * 解析分享链接参数
 * @param searchParams URLSearchParams对象
 * @returns 分享信息对象
 */
export interface ShareInfo {
  isShared: boolean;
  shareUserId?: string;
  originalUserId?: string;
  isOwner: boolean;
}

export const parseShareInfo = (searchParams: URLSearchParams, currentUserId: string): ShareInfo => {
  const isShared = searchParams.get('isShared') === 'true';
  const encryptedShareUserId = searchParams.get('shareUserId');

  

  if (!isShared || !encryptedShareUserId) {
    return {
      isShared: false,
      isOwner: true,
    };
  }

  try {
    const originalUserId = decryptUserId(encryptedShareUserId);
    const isOwner = currentUserId === originalUserId;
    console.log('parseShareInfo', isShared, originalUserId);
    return {
      isShared: true,
      shareUserId: encryptedShareUserId,
      originalUserId,
      isOwner,
    };
  } catch (error) {
    console.error('解析分享信息失败:', error);
    // 解析失败时，认为不是分享链接
    return {
      isShared: false,
      isOwner: true,
    };
  }
};

/**
 * 复制分享链接到剪贴板
 * @param shareUrl 分享链接
 * @returns 是否复制成功
 */
export const copyShareUrl = async (shareUrl: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // 使用现代 Clipboard API
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } else {
      // 降级方案：使用传统的 document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      return successful;
    }
  } catch (error) {
    console.error('复制分享链接失败:', error);
    return false;
  }
};

/**
 * 验证分享权限
 * @param conversationId 会话ID
 * @param userId 用户ID
 * @returns 是否有分享权限
 */
export const validateSharePermission = (
  conversationId: string,
  userId: string,
  originalUserId: string
): boolean => {
  // 这里可以添加更多的权限验证逻辑
  // 例如：检查用户是否是会话的创建者
  // 目前简单验证用户ID是否存在且不是访客
  return Boolean(userId && userId === originalUserId);
};

/**
 * 格式化分享消息
 * @param agentName 智能体名称
 * @param conversationTitle 对话标题
 * @returns 分享消息文本
 */
export const formatShareMessage = (agentName: string, conversationTitle: string): string => {
  return `我在${agentName}中的对话："${conversationTitle}"，点击查看详情`;
};

// 拼接信息
export const setDescOrShareStr = (title: string, desc: string, icon: string) => {
  const shareStr = {
    title: title,
    desc: desc,
    icon: icon || 'https://space.tongfudun.com/favicon.ico',
  };
  return window.btoa(unescape(window.encodeURIComponent(JSON.stringify(shareStr))));
};
