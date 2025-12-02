import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Checkbox } from "antd";
import { useTranslation } from 'react-i18next';
import { authAPI, PhoneLoginParams, EmailLoginParams } from '../../api/auth';
import { setUser, setToken } from '../../stores/slices/authSlice';
import { handleLoginSuccess } from '../../utils/loginUtils';
import OpenInApp from '../../globalComponents/openInApp';
import { isApp } from '../../utils/uaHelper';
import logoPng from '../../assets/images/logo/logo.png'
import logoPngEn from '../../assets/images/logo/logo_en.png'
import './Login.scss';

// 登录方式枚举
enum LoginType {
  PHONE = 'phone',
  EMAIL = 'email'
}

interface LoginProps {
  className?: string;
}

const Login: React.FC<LoginProps> = ({ className = '' }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  
  // 表单状态
  const [loginType, setLoginType] = useState<LoginType>(LoginType.PHONE);
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // 手机号登录状态
  const [phoneForm, setPhoneForm] = useState({
    areaCode: '+86',
    mobile: '',
    verifyCode: ''
  });
  
  // 邮箱登录状态
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: ''
  });
  
  // 验证码相关状态
  const [verifyCodeLoading, setVerifyCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // 错误状态
  const [error, setError] = useState('');
  
  // 协议弹窗状态
  const [agreementModal, setAgreementModal] = useState<{
    isOpen: boolean;
    type: 'terms' | 'privacy';
  }>({
    isOpen: false,
    type: 'terms'
  });

  // OpenInApp组件引用
  const openInAppRef = useRef<any>(null);
  
  // 获取返回URL和参数（通过工具函数处理）

  useEffect(() => {
    if (isApp()) {
      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect);
      }
    }
  }, [searchParams]);
  
  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  // 获取验证码
  const handleGetVerifyCode = async () => {
    if (!phoneForm.mobile) {
      setError(t('login.phoneRequired'));
      return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(phoneForm.mobile)) {
      setError(t('login.phoneInvalid'));
      return;
    }
    
    setVerifyCodeLoading(true);
    setError('');
    
    try {
      await authAPI.getVerifyCode({
        mobile: phoneForm.mobile,
        areaCode: '86'
      });
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || t('login.getVerifyCodeFailed'));
    } finally {
      setVerifyCodeLoading(false);
    }
  };
  
  // 手机号登录
  const handlePhoneLogin = async () => {
    if (!phoneForm.mobile || !phoneForm.verifyCode) {
      setError(t('login.fillAllFields'));
      return;
    }
    
    if (!agreeTerms) {
      setError(t('login.agreeTermsRequired'));
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.phoneLogin({
        mobile: phoneForm.mobile,
        verifyCode: phoneForm.verifyCode,
        areaCode: phoneForm.areaCode
      });
      
      // 保存登录状态 - 与二维码登录和自动登录保持一致
      dispatch(setUser(response.user));
      dispatch(setToken(response.token));
      
      // 持久化存储认证信息
      localStorage.setItem('token', response.token);
      localStorage.setItem('userId', response.user.id);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // 跳转回原页面
      handleSuccessRedirect();
    } catch (err: any) {
      setError(err.message || t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };
  
  // 邮箱登录
  const handleEmailLogin = async () => {
    if (!emailForm.email || !emailForm.password) {
      setError(t('login.fillAllFields'));
      return;
    }
    
    if (!agreeTerms) {
      setError(t('login.agreeTermsRequired'));
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.email)) {
      setError(t('login.emailInvalid'));
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.emailLogin({
        email: emailForm.email,
        password: emailForm.password
      });
      
      // 保存登录状态
      dispatch(setUser(response.user));
      dispatch(setToken(response.token));
      
      // 跳转回原页面
      handleSuccessRedirect();
    } catch (err: any) {
      setError(err.message || t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };
  
  // 成功后跳转处理
  const handleSuccessRedirect = () => {
    handleLoginSuccess(navigate, searchParams);
  };
  
  // 打开App - 使用OpenInApp组件
  const handleOpenApp = () => {
    // 检查是否在APP内
    const isInApp = isApp();
    
    // 如果不在APP内，调用OpenInApp组件
    if (!isInApp) {
      if (openInAppRef.current && openInAppRef.current.handleOpenInApp) {
        openInAppRef.current.handleOpenInApp();
      }
    } else {
      // 如果已经在APP内，可以执行其他逻辑或不做任何操作
      console.log('已在APP内，无需打开');
    }
  };
  
  // 打开协议弹窗
  const handleOpenAgreement = (type: 'terms' | 'privacy') => {
    setAgreementModal({
      isOpen: true,
      type
    });
  };
  
  // 关闭协议弹窗
  const handleCloseAgreement = () => {
    setAgreementModal({
      isOpen: false,
      type: 'terms'
    });
  };
  
  return (
    <div className={`login-page ${className}`}>
      {/* 顶部背景和Logo */}
      <div className="login-header">
        <div className="bg-gradient"></div>
        <div className="logo-section">
          <div className="logo">
            <img src={i18n.language === 'en' ? logoPngEn : logoPng} alt="LegionSpace" />
          </div>
        </div>
      </div>
      
      {/* 登录表单 */}
      <div className="login-form">
        {/* 登录方式切换 */}
        {/* <div className="login-tabs">
          <button
            className={`tab-button ${loginType === LoginType.EMAIL ? 'active' : ''}`}
            onClick={() => setLoginType(LoginType.EMAIL)}
          >
            {t('login.emailLogin')}
          </button>
          <button
            className={`tab-button ${loginType === LoginType.PHONE ? 'active' : ''}`}
            onClick={() => setLoginType(LoginType.PHONE)}
          >
            {t('login.login')}
          </button>
        </div> */}
        
        {/* 错误提示 */}
        {error && <div className="error-message">{error}</div>}
        
        {/* 手机号登录表单 */}
        {loginType === LoginType.PHONE && (
          <div className="phone-form">
            <div className="input-group">
              <div className="phone-input">
                <div className="country-code">
                  <span>{phoneForm.areaCode}</span>
                  <div className="divider"></div>
                </div>
                <input
                  type="tel"
                  maxLength={11}
                  placeholder={t('login.phonePlaceholder')}
                  value={phoneForm.mobile}
                  onChange={(e) => setPhoneForm({...phoneForm, mobile: e.target.value})}
                />
              </div>
            </div>
            
            <div className="input-group">
              <div className="verify-input">
                <input
                  type="text"
                  placeholder={t('login.verifyCodePlaceholder')}
                  value={phoneForm.verifyCode}
                  maxLength={6}
                  onChange={(e) => setPhoneForm({...phoneForm, verifyCode: e.target.value})}
                />
                <button
                  className="get-code-btn"
                  onClick={handleGetVerifyCode}
                  disabled={verifyCodeLoading || countdown > 0}
                >
                  {countdown > 0 ? `${countdown}s` : t('login.getVerifyCode')}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 邮箱登录表单 */}
        {loginType === LoginType.EMAIL && (
          <div className="email-form">
            <div className="input-group">
              <input
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={emailForm.email}
                onChange={(e) => setEmailForm({...emailForm, email: e.target.value})}
              />
            </div>
            
            <div className="input-group">
              <input
                type="password"
                placeholder={t('login.passwordPlaceholder')}
                value={emailForm.password}
                onChange={(e) => setEmailForm({...emailForm, password: e.target.value})}
              />
            </div>
          </div>
        )}
        
        {/* 协议同意 */}
        <div className="agreement-section">
          <div className="checkbox-wrapper">
            <Checkbox
              id="agree-terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <label htmlFor="agree-terms">
              {t('login.agreeTerms')}
              <button 
                type="button"
                className="link-button" 
                onClick={() => handleOpenAgreement('terms')}
              >
                {t('login.userAgreement')}
              </button>
              与
              <button 
                type="button"
                className="link-button" 
                onClick={() => handleOpenAgreement('privacy')}
              >
                {t('login.privacyPolicy')}
              </button>
            </label>
          </div>
        </div>
        
        {/* 登录按钮 */}
        <button
          className="login-button"
          onClick={loginType === LoginType.PHONE ? handlePhoneLogin : handleEmailLogin}
          disabled={loading}
        >
          {loading ? t('login.loginLoading') : t('login.login')}
        </button>
      </div>
      
      {/* 底部App打开按钮 */}
      <div className="app-open-section">
        <button className="app-open-button" onClick={handleOpenApp}>
          {t('login.openInApp')}
        </button>
      </div>
      
      {/* 协议弹窗 */}
    

      {/* 隐藏的OpenInApp组件，用于直接调用API */}
      <OpenInApp ref={openInAppRef} />
    </div>
  );
};

export default Login;
