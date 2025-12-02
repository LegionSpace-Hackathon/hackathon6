import React, { useState } from 'react';
import {
  generateShareUrl,
  copyShareUrl,
  validateSharePermission,
} from '../../../../../utils/shareUtils';
import { getUserIdentifier } from '../../../api/difyStream';
import './ShareButton.scss';
import { isApp } from '@/utils/uaHelper';
import { callNativeMethods } from '@/utils/chainpal-utils-0.0.4.js';
import { Toast } from 'antd-mobile';
import { useTranslation } from 'react-i18next';

interface ShareButtonProps {
  agentId: string;
  conversationId?: string;
  agentName?: string;
  className?: string;
  disabled?: boolean;
  originalUserId?: string;
  agentLogo?: string; // 智能体logo
  agentAvatar?: string; // 智能体头像
  currentAgent?: any;
}

/**
 * 分享按钮组件
 */
const ShareButton: React.FC<ShareButtonProps> = ({
  agentId,
  conversationId,
  originalUserId,
  agentName = '智能体',
  agentLogo,
  agentAvatar,
  className = '',
  disabled = false,
  currentAgent,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const {t} = useTranslation()

  const handleShare = async () => {
    if (!conversationId || disabled || isSharing) {
      return;
    }

    setIsSharing(true);

    try {
      const userId = getUserIdentifier();
      console.log('userId', userId, originalUserId, conversationId);
      // 验证分享权限
      if (!userId || userId === '-1') {
        Toast.show({
          content: t('agent.noVisitorShare'),
          icon: 'fail',
        });
        return;
      }
      if (!!originalUserId) {
        if (!validateSharePermission(conversationId, userId, originalUserId)) {
          Toast.show({
            content: t('agent.noSharePermission'),
            icon: 'fail',
          });
          return;
        }
      }
      // 生成分享链接
      const shareUrl = generateShareUrl(agentId, conversationId, userId);

      if (isApp()) {
        let title = document.title.split('-')?.[0];
        const headerDesc = document.querySelector('#agent_header_desc')?.textContent;
        
        // 根据智能体名称选择默认logo
        title =  title + ' － ' + headerDesc;
        const desc = t('agent.shareVia').replace('{name}', document.title.split('-')?.[0]?.trim());
        const iconUrl = agentName?.indexOf('招财猫') > -1
          ? 'https://prove-image.tongfudun.com/sales.png'
          : 'https://prove-image.tongfudun.com/customer.png';
        
        callNativeMethods('NativeShare', {
          title,
          iconUrl: iconUrl,
          desc,
          shareUrl: shareUrl,
        });
      } else {
        // 复制到剪贴板
        const success = await copyShareUrl(shareUrl);

        if (success) {
          setShareSuccess(true);
          Toast.show({
            content: '已复制分享链接',
            icon: 'success',
          });
        } else {
          Toast.show({
            content: '复制到剪贴板失败',
            icon: 'fail',
          });
        }
      }
    } catch (error) {
      console.error('分享失败:', error);
      Toast.show({
        content: '分享失败: ' + (error instanceof Error ? error.message : '未知错误'),
        icon: 'fail',
      });
    } finally {
      setIsSharing(false);
    }
  };

  // 如果没有会话ID，不显示分享按钮
  if (!conversationId) {
    return null;
  }

  return (
    <button
      className={`share-button ${className} ${disabled ? 'disabled' : ''} ${shareSuccess ? 'success' : ''}`}
      onClick={handleShare}
      disabled={disabled || isSharing}
      title={shareSuccess ? '已复制分享链接' : `分享与${agentName}的对话`}
    >
      <div className="share-normal">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </div>
      {/* {isSharing ? (
        <div className="share-loading">
          <div className="loading-spinner"></div>
          <span>分享中...</span>
        </div>
      ) : shareSuccess ? (
        <div className="share-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
          <span>已复制链接</span>
        </div>
      ) : (
       
      )} */}
    </button>
  );
};

export default ShareButton;
