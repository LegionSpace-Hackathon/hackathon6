import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../lib/apiClient';
import { authAPI } from '../../api/auth';
import { PageState, savePageState, getSavedPageState, clearSavedPageState, restorePageState } from '../../utils/pageStateManager';

// 用户信息接口
export interface User {
  id: string;
  username: string;
  name?: string;
  mobile?: string;
  email?: string;
  portrait?: string;
  role: 'admin' | 'developer' | 'generic'; // 管理员、开发者、普通用户
  permissions: string[]; // 权限列表
  authStatus?: number; // 认证状态：0(待审核), 1(审核通过), -1(审核拒绝), -2(系统生成/未提交)
}

// 二维码参数接口
export interface QrParams {
  token: string;
  timestamp: number;
  qrCode?: string;
}

// QR响应接口
interface QrResponse {
  token: string;
  qrCode?: string;
}

// 登录成功后的跳转配置
export interface LoginRedirectConfig {
  path?: string;        // 自定义跳转路径
  replace?: boolean;    // 是否使用replace而不是push
  usePageRestore?: boolean; // 是否使用页面状态恢复（优先级低于自定义路径）
}

// Auth状态接口
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  qrParams: QrParams | null;
  qrLoading: boolean;
  qrError: string | null;
  loginLoading: boolean;
  loginError: string | null;
  loginModalVisible: boolean;
  autoLoginLoading: boolean;
  autoLoginError: string | null;
  // 自动登录状态管理
  autoLoginAttempted: boolean; // 是否已尝试过自动登录
  autoLoginInProgress: boolean; // 自动登录是否正在进行中
  // 页面状态管理
  savedPageState: PageState | null;
  shouldRestorePageState: boolean;
  // 登录后跳转配置
  loginRedirectConfig: LoginRedirectConfig | null;
  // 组织数据加载标记
  shouldFetchOrganization: boolean; // 是否需要加载组织列表
}

// 检查token是否有效（简单检查，不进行网络验证）
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  
  try {
    // 检查token格式（JWT格式检查）
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // 检查token是否过期（如果包含过期时间）
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('Token格式检查失败:', error);
    return false;
  }
};

// 从localStorage加载认证状态
const loadAuthState = (): Partial<AuthState> => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  let user: User | null = null;

  if (userString) {
    try {
      user = JSON.parse(userString);
    } catch (e) {
      localStorage.removeItem('user');
    }
  }

  // 检查token有效性
  const isValidToken = isTokenValid(token);

  return {
    isAuthenticated: !!token && !!user && isValidToken,
    token,
    user,
  };
};

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  qrParams: null,
  qrLoading: false,
  qrError: null,
  loginLoading: false,
  loginError: null,
  loginModalVisible: false,
  autoLoginLoading: false,
  autoLoginError: null,
  // 自动登录状态管理
  autoLoginAttempted: false,
  autoLoginInProgress: false,
  // 页面状态管理
  savedPageState: null,
  shouldRestorePageState: false,
  // 登录后跳转配置
  loginRedirectConfig: null,
  // 组织数据加载标记
  shouldFetchOrganization: false,
  ...loadAuthState(), // 加载持久化的认证状态
};

// 获取二维码参数
export const getQrCode = createAsyncThunk<QrResponse, void, { state: { auth: AuthState } }>(
  'auth/getQrCode', 
  async (_, { getState }) => {
    try {
      // apiClient的响应拦截器已经处理了response.data
      const data: any = await apiClient.get('/login/chainPalQRParam');
      console.log('获取QR码成功:', data);

      return {
        token: data.data.token || '',
        qrCode: {
          timestamp: new Date().getTime(),
          ...data.data,
        },
      };
    } catch (error) {
      console.error('获取二维码失败:', error);
      throw new Error('获取二维码失败');
    }
  },
  {
    // 条件检查：防止重复调用
    condition: (_, { getState }) => {
      const state = getState();
      const { qrLoading, qrParams } = state.auth;
      
      // 如果正在加载中，跳过
      if (qrLoading) {
        console.log('QR码正在加载中，跳过重复请求');
        return false;
      }
      
      // 如果QR码数据存在且未过期（2分钟内），跳过
      if (qrParams && qrParams.timestamp && qrParams.qrCode) {
        const now = Date.now();
        const age = now - qrParams.timestamp;
        if (age < 120000) { // 2分钟
          console.log('QR码数据仍然有效，跳过重复请求');
          return false;
        }
      }
      
      return true;
    }
  }
);

// 检查二维码登录状态
export const checkQrLogin = createAsyncThunk(
  'auth/checkQrLogin', 
  async (token: string, { getState }: { getState: () => any }) => {
    try {
      const response: any = await apiClient.post('/login/qrLogin', { qrToken: token });
      console.log('检查QR登录状态:', response);

      if (response.data && response.code === 0) {
        if (response.data?.userInfo?.mobile) {
          response.data.userInfo.mobileOld = response.data.userInfo.mobile;
          response.data.userInfo.mobile = response.data.userInfo.mobile.replace(
            /(\d{3})\d{4}(\d{4})/,
            '$1****$2'
          );
        }
        response.data.userInfo.role = response.data.role;
        return {
          success: true,
          user: response.data?.userInfo,
          token: response.data?.token,
          userId: response.data?.userInfo?.id,
        };
      } else {
        return {
          success: false,
          message: '等待用户确认...',
        };
      }
    } catch (error) {
      console.error('登录验证失败:', error);
      throw new Error('登录验证失败');
    }
  },
  {
    // 条件检查：防止重复调用
    condition: (_, { getState }: { getState: () => any }) => {
      const state = getState();
      const { loginLoading, isAuthenticated } = state.auth;
      
      // 如果正在登录中，跳过
      if (loginLoading) {
        console.log('登录检查正在进行中，跳过重复请求');
        return false;
      }
      
      // 如果已经登录，跳过
      if (isAuthenticated) {
        console.log('用户已登录，跳过登录检查');
        return false;
      }
      
      return true;
    }
  }
);

// App自动授权登录
export const autoAppLogin = createAsyncThunk(
  'auth/autoAppLogin',
  async (token: string, { rejectWithValue, getState }) => {
    try {
      const response = await authAPI.autoLogin({ chainPalToken: token });

      if (response.data && response.data.userInfo) {
        response.data.userInfo.mobileOld = response.data.userInfo.mobile;
        // 如果有手机号，做掩码处理
        if (response.data.userInfo.mobile) {
          response.data.userInfo.mobile = response.data.userInfo.mobile.replace(
            /(\d{3})\d{4}(\d{4})/,
            '$1****$2'
          );
        }
        response.data.userInfo.role = response.data.role;
        return {
          success: true,
          user: response.data.userInfo,
          token: response.data.token,
          userId: response.data?.userInfo?.id,
        };
      } else {
        return rejectWithValue('自动登录失败：未获取到用户信息');
      }
    } catch (error) {
      console.error('自动登录失败', error);
      return rejectWithValue('自动登录失败');
    }
  },
  {
    // 条件检查：防止重复调用，但允许正常的自动登录
    condition: (_, { getState }) => {
      const state = getState() as { auth: AuthState };
      const { autoLoginAttempted, autoLoginInProgress, isAuthenticated, token } = state.auth;
      
      // 如果自动登录正在进行中，跳过（防止并发）
      if (autoLoginInProgress) {
        console.log('自动登录正在进行中，跳过重复请求');
        return false;
      }
      
      // 如果已经尝试过自动登录且用户已认证，跳过（防止重复调用）
      if (autoLoginAttempted && isAuthenticated && token) {
        console.log('自动登录已尝试过且用户已认证，跳过重复请求');
        return false;
      }
      
      return true;
    }
  }
);

// 退出登录
export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 设置登录Modal显示状态
    setLoginModalVisible: (state, action: PayloadAction<boolean>) => {
      state.loginModalVisible = action.payload;
    },
    // 更新二维码参数
    updateQrParams: (state, action: PayloadAction<Partial<QrParams>>) => {
      if (state.qrParams) {
        state.qrParams = { ...state.qrParams, ...action.payload };
      }
    },
    // 清除错误信息
    clearErrors: (state) => {
      state.qrError = null;
      state.loginError = null;
      state.autoLoginError = null;
    },
    // 设置token
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload);
    },
    // 设置用户信息
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    // 清除认证信息
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      // 重置自动登录状态
      state.autoLoginAttempted = false;
      state.autoLoginInProgress = false;
      state.autoLoginError = null;
      // 重置组织加载标记
      state.shouldFetchOrganization = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    // 保存当前页面状态（在需要登录时调用）
    saveCurrentPageState: (state) => {
      const currentState = getSavedPageState();
      if (currentState) {
        state.savedPageState = currentState;
        state.shouldRestorePageState = true;
      }
    },
    // 触发保存页面状态到sessionStorage
    triggerSavePageState: (state) => {
      // 这个action主要用于触发页面状态保存的副作用
      // 实际保存逻辑在中间件或组件中处理
      savePageState();
    },
    // 设置是否需要恢复页面状态
    setShouldRestorePageState: (state, action: PayloadAction<boolean>) => {
      state.shouldRestorePageState = action.payload;
    },
    // 恢复页面状态
    restoreToSavedPage: (state) => {
      if (state.shouldRestorePageState) {
        restorePageState();
        state.shouldRestorePageState = false;
        state.savedPageState = null;
      }
    },
    // 清除页面状态
    clearPageState: (state) => {
      state.savedPageState = null;
      state.shouldRestorePageState = false;
      clearSavedPageState();
    },
    // 设置登录后的跳转配置
    setLoginRedirectConfig: (state, action: PayloadAction<LoginRedirectConfig | null>) => {
      state.loginRedirectConfig = action.payload;
    },
    // 清除登录跳转配置
    clearLoginRedirectConfig: (state) => {
      state.loginRedirectConfig = null;
    },
    // 显示登录框并设置跳转配置
    showLoginWithRedirect: (state, action: PayloadAction<LoginRedirectConfig>) => {
      // 如果有自定义路径，则不保存页面状态
      if (action.payload.path) {
        state.shouldRestorePageState = false;
      } else if (action.payload.usePageRestore !== false) {
        // 如果没有自定义路径且允许页面恢复，则保存页面状态
        savePageState();
        state.shouldRestorePageState = true;
      }
      
      state.loginRedirectConfig = action.payload;
      state.loginModalVisible = true;
    },
    // 设置自动登录尝试状态
    setAutoLoginAttempted: (state, action: PayloadAction<boolean>) => {
      state.autoLoginAttempted = action.payload;
    },
    // 设置自动登录进行状态
    setAutoLoginInProgress: (state, action: PayloadAction<boolean>) => {
      state.autoLoginInProgress = action.payload;
    },
    // 重置自动登录状态
    resetAutoLoginState: (state) => {
      state.autoLoginAttempted = false;
      state.autoLoginInProgress = false;
      state.autoLoginError = null;
    },
    // 清除组织加载标记
    clearShouldFetchOrganization: (state) => {
      state.shouldFetchOrganization = false;
    },
  },
  extraReducers: (builder) => {
    // 获取二维码
    builder
      .addCase(getQrCode.pending, (state) => {
        state.qrLoading = true;
        state.qrError = null;
      })
      .addCase(getQrCode.fulfilled, (state, action) => {
        state.qrLoading = false;
        state.qrParams = {
          token: action.payload.token,
          timestamp: Date.now(),
          qrCode: action.payload.qrCode,
        };
      })
      .addCase(getQrCode.rejected, (state, action) => {
        state.qrLoading = false;
        state.qrError = action.error.message || '获取二维码失败';
      });

    // 检查二维码登录状态
    builder
      .addCase(checkQrLogin.pending, (state) => {
        state.loginLoading = true;
        state.loginError = null;
      })
      .addCase(checkQrLogin.fulfilled, (state, action) => {
        state.loginLoading = false;
        if (action.payload.success) {
          state.isAuthenticated = true;
          state.user = action.payload.user as any;
          state.token = action.payload.token as string;
          state.loginModalVisible = false;

          // 持久化存储认证信息
          localStorage.setItem('token', action.payload.token as string);
          localStorage.setItem('userId', action.payload.userId as string);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
          
          // 标记需要加载组织列表
          state.shouldFetchOrganization = true;
        }
      })
      .addCase(checkQrLogin.rejected, (state, action) => {
        state.loginLoading = false;
        state.loginError = action.error.message || '登录失败';
      });

    // 自动授权登录
    builder
      .addCase(autoAppLogin.pending, (state) => {
        state.autoLoginLoading = true;
        state.autoLoginInProgress = true;
        state.autoLoginError = null;
      })
      .addCase(autoAppLogin.fulfilled, (state, action) => {
        state.autoLoginLoading = false;
        state.autoLoginInProgress = false;
        state.autoLoginAttempted = true;
        
        if (action.payload.success) {
          state.isAuthenticated = true;
          state.user = action.payload.user as User;
          state.token = action.payload.token as string;

          // 持久化存储认证信息
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('userId', action.payload.userId as string);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
          
          // 标记需要加载组织列表
          state.shouldFetchOrganization = true;
          
          console.log('自动登录成功');
        }
      })
      .addCase(autoAppLogin.rejected, (state, action) => {
        state.autoLoginLoading = false;
        state.autoLoginInProgress = false;
        state.autoLoginAttempted = true;
        
        // 只有在特定错误情况下才设置错误信息，避免网络问题导致token丢失
        const errorMessage = action.payload as string;
        if (errorMessage && !errorMessage.includes('已尝试过') && !errorMessage.includes('已认证')) {
          state.autoLoginError = errorMessage;
          console.warn('自动登录失败:', errorMessage);
        } else {
          // 对于已尝试过或已认证的情况，不设置错误信息
          console.log('自动登录跳过:', errorMessage);
        }
      });

    // 退出登录
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      // 重置自动登录状态，允许下次重新自动登录
      state.autoLoginAttempted = false;
      state.autoLoginInProgress = false;
      state.autoLoginError = null;
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/';
    });
  },
});

export const { 
  setLoginModalVisible, 
  updateQrParams, 
  clearErrors, 
  setToken, 
  setUser, 
  clearAuth,
  saveCurrentPageState,
  triggerSavePageState,
  setShouldRestorePageState,
  restoreToSavedPage,
  clearPageState,
  setLoginRedirectConfig,
  clearLoginRedirectConfig,
  showLoginWithRedirect,
  setAutoLoginAttempted,
  setAutoLoginInProgress,
  resetAutoLoginState,
  clearShouldFetchOrganization
} = authSlice.actions;

export default authSlice.reducer;
