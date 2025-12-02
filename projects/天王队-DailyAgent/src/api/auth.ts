import apiClient from '../lib/apiClient';
import { User } from '../stores/slices/authSlice';

// 登录相关API接口定义

// 手机号登录参数
export interface PhoneLoginParams {
  mobile: string;
  verifyCode: string;
  areaCode?: string;
}

// 邮箱登录参数
export interface EmailLoginParams {
  email: string;
  password: string;
}

// 获取手机验证码参数
export interface GetVerifyCodeParams {
  mobile: string;
  areaCode?: string;
}

// 登录响应
export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// 获取二维码参数
export interface QrLoginParams {
  secretId?: string;
}

export interface QrLoginResponse {
  token: string;
  qrCode: string;
  timestamp: number;
}

// 检查二维码登录状态
export interface QrStatusParams {
  token: string;
}

export interface QrStatusResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// 自动登录参数接口
export interface AutoLoginParams {
  chainPalToken: string;
}

// 用户登录API
export const authAPI = {
  // 获取二维码参数
  getQrCode: async (params?: QrLoginParams): Promise<QrLoginResponse> => {
    const response = await apiClient.post('/login/qrcode/linkApp/param', params || {});
    return response as unknown as QrLoginResponse;
  },

  // 检查二维码登录状态
  checkQrStatus: async (params: QrStatusParams): Promise<QrStatusResponse> => {
    const response = await apiClient.post('/login/qrcode/linkApp/webCallback', params);
    return response as unknown as QrStatusResponse;
  },

  // 自动授权登录（App内调用）
  autoLogin: async (params: AutoLoginParams): Promise<{ user: User; token: string; data: any }> => {
    const response = await apiClient.post('/login/autoLogin', params);
    return response as unknown as { user: User; token: string; data: any };
  },

  // 用户登录（密码登录）
  login: async (params: { username: string; password: string }): Promise<{ user: User; token: string }> => {
    const response = await apiClient.post('/login', params);
    return response as unknown as { user: User; token: string };
  },

  // 手机号登录
  phoneLogin: async (params: PhoneLoginParams): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post('/login/smsLogin', {
        mobile: params.mobile,
        verifyCode: params.verifyCode,
        areaCode: params.areaCode || '+86'
      });
      
      // 根据接口文档，返回格式与二维码登录、自动登录相同
      if (response.data && response.code === 0) {
        // 处理用户信息，与二维码登录保持一致
        const userInfo = response.data.userInfo || response.data;
        if (userInfo.mobile) {
          userInfo.mobileOld = userInfo.mobile;
          userInfo.mobile = userInfo.mobile.replace(
            /(\d{3})\d{4}(\d{4})/,
            '$1****$2'
          );
        }
        userInfo.role = response.data.role || 'generic';
        
        return {
          user: userInfo,
          token: response.data.token,
          refreshToken: response.data.refreshToken
        };
      } else {
        throw new Error(response.msg || '登录失败');
      }
    } catch (error: any) {
      console.error('手机号登录失败:', error);
      throw new Error(error.response?.data?.msg || error.message || '登录失败');
    }
  },

  // 邮箱登录
  emailLogin: async (params: EmailLoginParams): Promise<LoginResponse> => {
    // Mock 数据 - 后续替换为真实API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (params.email && params.password === '123456') {
          resolve({
            user: {
              id: 'mock_user_' + Date.now(),
              username: params.email.split('@')[0],
              email: params.email,
              avatar: '',
              role: 'user',
              permissions: []
            },
            token: 'mock_token_' + Date.now(),
            refreshToken: 'mock_refresh_token_' + Date.now()
          });
        } else {
          reject(new Error('邮箱或密码错误'));
        }
      }, 1000);
    });
  },

  // 获取手机验证码
  getVerifyCode: async (params: GetVerifyCodeParams): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiClient.get('/login/phoneVerifyCode', {
        params: {
          areaCode: params.areaCode || '+86',
          mobile: params.mobile
        }
      });
      
      if (response.code === 0) {
        return {
          success: true,
          message: response.msg || '验证码已发送'
        };
      } else {
        throw new Error(response.msg || '获取验证码失败');
      }
    } catch (error: any) {
      console.error('获取验证码失败:', error);
      throw new Error(error.response?.data?.msg || error.message || '获取验证码失败');
    }
  },

  // 退出登录
  logout: async (): Promise<void> => {
    await apiClient.post('/logout');
  },

  // 获取用户权限
  getUserPermissions: async (): Promise<string[]> => {
    const response = await apiClient.get('/privilege');
    return response as unknown as string[];
  },
}; 