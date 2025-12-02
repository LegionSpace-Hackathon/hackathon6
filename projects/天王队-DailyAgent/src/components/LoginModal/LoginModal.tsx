import React, { useEffect, useRef, useCallback } from 'react';
import { Modal, Spin, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { 
  setLoginModalVisible, 
  getQrCode, 
  checkQrLogin, 
  updateQrParams
} from '../../stores/slices/authSlice';
import { getUAType } from '../../utils/uaHelper';
import './LoginModal.scss';

interface LoginModalProps {
  visible: boolean;
  onCancel: () => void;
  onClose?: () => void; // 新增：关闭回调函数，用于处理关闭后的导航逻辑
}

const LoginModal: React.FC<LoginModalProps> = ({ visible, onCancel, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { 
    qrParams, 
    qrLoading, 
    qrError,
    isAuthenticated
  } = useAppSelector(state => state.auth);
  console.log(qrParams?.qrCode);
  
  // 使用useRef存储定时器ID，避免重渲染
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const qrRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 清除所有定时器的函数
  const clearAllTimers = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    if (qrRefreshTimerRef.current) {
      clearInterval(qrRefreshTimerRef.current);
      qrRefreshTimerRef.current = null;
    }
  }, []);

  // 检测是否为移动设备并跳转到手机号登录页面
  const handleMobileRedirect = useCallback(() => {
    const uaType = getUAType;
    console.log('当前设备类型:', uaType);
    
    // 如果是移动设备，跳转到手机号登录页面
    if (uaType === 'm') {
      console.log('检测到移动设备，跳转到手机号登录页面');
      
      // 构建登录页面URL，保留当前的所有查询参数
      const currentSearch = window.location.search;
      const loginUrl = `/login${currentSearch}`;
      
      // 关闭登录弹窗
      dispatch(setLoginModalVisible(false));
      
      // 跳转到手机号登录页面
      navigate(loginUrl);
      
      return true; // 表示已处理移动设备跳转
    }
    
    return false; // 表示不是移动设备，继续显示扫码弹窗
  }, [dispatch, navigate]);
  
  // 获取二维码
  const handleGetQrCode = useCallback(() => {
    dispatch(getQrCode());
  }, [dispatch]);

  // 智能获取QR码的回调函数
  const handleSmartGetQrCode = useCallback(() => {
    // 只有在没有QR码数据或QR码数据过期时才获取新的QR码
    const shouldGetNewQrCode = !qrParams || 
      !qrParams.qrCode || 
      !qrParams.timestamp || 
      (Date.now() - qrParams.timestamp > 120000); // 2分钟过期
    
    if (shouldGetNewQrCode) {
      console.log('获取新的QR码');
      handleGetQrCode();
    } else {
      console.log('使用现有QR码，跳过重复请求');
    }
  }, [qrParams, handleGetQrCode]);

  // 更新二维码时间戳
  const updateQrCodeTimestamp = useCallback(() => {
    if (qrParams?.qrCode) {
      try {
        // 如果qrCode是字符串形式的JSON，则先解析为对象
        let qrCodeData;
        if (typeof qrParams.qrCode === 'string') {
          qrCodeData = JSON.parse(qrParams.qrCode);
        } else {
          qrCodeData = qrParams.qrCode;
        }
        
        // 更新时间戳
        qrCodeData = {
          ...qrCodeData,
          timestamp: new Date().getTime(),
        };
        
        dispatch(updateQrParams({
          qrCode: qrCodeData
        }));
      } catch (error) {
        console.error('二维码数据格式错误:', error);
      }
    }
  }, [dispatch, qrParams]);

  // 初始化二维码和设置定时器
  useEffect(() => {
    if (visible) {
      // 首先检测是否为移动设备，如果是则跳转到手机号登录页面
      const isMobileRedirected = handleMobileRedirect();
      
      // 如果是移动设备，直接返回，不执行后续的二维码逻辑
      if (isMobileRedirected) {
        return;
      }
      
      // 清除之前可能存在的所有定时器
      clearAllTimers();
      
      // 获取QR码
      handleSmartGetQrCode();
      
      // 设置定时器（延迟设置，确保QR码获取完成）
      const timer = setTimeout(() => {
        // 设置自动刷新二维码时间戳的定时器
        if (qrParams?.qrCode) {
          const refreshTimer = setInterval(() => {
            updateQrCodeTimestamp();
          }, 5000);
          qrRefreshTimerRef.current = refreshTimer;
        }
        
        // 设置检查登录状态的定时器
        if (qrParams?.token) {
          console.log('设置登录检查定时器，token:', qrParams.token);
          const pollingTimer = setInterval(() => {
            dispatch(checkQrLogin(qrParams.token));
          }, 2000);
          pollingTimerRef.current = pollingTimer;
        }
      }, 1000); // 延迟1秒设置定时器
      
      return () => {
        clearTimeout(timer);
        clearAllTimers();
      };
    } else {
      // 如果模态框不可见，清除所有定时器
      clearAllTimers();
    }
    
    // 组件卸载时清除所有定时器
    return clearAllTimers;
  }, [visible, clearAllTimers, handleSmartGetQrCode, qrParams, updateQrCodeTimestamp, dispatch, handleMobileRedirect]);
  
  // 刷新二维码
  const handleRefreshQrCode = useCallback(() => {
    // 刷新二维码时，先清除所有定时器
    clearAllTimers();
    handleGetQrCode();
  }, [handleGetQrCode, clearAllTimers]);
  
  // 监听登录状态，登录成功时清除所有定时器
  useEffect(() => {
    if (isAuthenticated) {
      clearAllTimers();
    }
  }, [isAuthenticated, clearAllTimers]);
  
  // 关闭Modal
  const handleCancel = useCallback(() => {
    clearAllTimers();
    onCancel();
    // 如果有自定义关闭回调，则执行
    if (onClose) {
      onClose();
    }
  }, [clearAllTimers, onCancel, onClose]);
  
  return (
    <Modal
      title={t('login.title')}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={400}
      centered
      className="login-modal"
    >
      <div className="qr-login-content">
        <div className="qr-description">
          <p>{t('login.qrDescription')}</p>
        </div>
        
        <div className="qr-code-container">
          {qrLoading ? (
            <div className="qr-loading">
              <Spin size="large" />
            </div>
          ) : qrError ? (
            <div className="qr-error">
              <p>{t('login.qrError')}</p>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={handleRefreshQrCode}
              >
                {t('login.refresh')}
              </Button>
            </div>
          ) : (qrParams && qrParams.qrCode) ? (
            <div className="qr-code">
              {Object.keys(qrParams.qrCode).length > 0 && <QRCodeSVG
                value={JSON.stringify(qrParams.qrCode)}
                size={170}
                level="M"
              />}
              <div className="qr-refresh">
                <Button 
                  type="link" 
                  icon={<ReloadOutlined />}
                  style={{ color: '#15D69C' }}
                  onClick={handleRefreshQrCode}
                >
                  {t('login.refreshQr')}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="qr-tips">
          <p>{t('login.qrTips')}</p>
        </div>
      </div>
    </Modal>
  );
};

export default LoginModal;