import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../services/api';
import './Login.css';

function Login(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 从 URL 查询参数或上一次登录的手机号中获取手机号
  useEffect(() => {
    const mobileParam = searchParams.get('mobile');
    if (mobileParam) {
      // 优先使用 URL 参数
      setPhoneNumber(mobileParam);
    } else {
      // 如果没有 URL 参数，读取上一次登录的手机号
      const lastPhoneNumber = localStorage.getItem('lastPhoneNumber');
      if (lastPhoneNumber) {
        setPhoneNumber(lastPhoneNumber);
      }
    }
  }, [searchParams]);

  // 验证手机号格式
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // 处理登录
  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!phoneNumber.trim()) {
      setError('请输入手机号');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('请输入正确的手机号');
      return;
    }

    setIsLoading(true);

    try {
      // 调用登录接口
      await login(phoneNumber);
      // 保存登录状态到 localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('phoneNumber', phoneNumber);
      // 保存当前手机号作为上一次登录的手机号（用于下次登录时预填充）
      localStorage.setItem('lastPhoneNumber', phoneNumber);
      // 跳转到聊天页面
      navigate('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>欢迎使用</h1>
          <p>VigilKeeper Agent</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="phone">手机号</label>
            <input
              id="phone"
              type="tel"
              placeholder="请输入手机号"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setError('');
              }}
              maxLength={11}
              className={error ? 'error' : ''}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="login-footer">
          <p>登录即表示同意用户协议和隐私政策</p>
        </div>
      </div>
    </div>
  );
}

export default Login;

