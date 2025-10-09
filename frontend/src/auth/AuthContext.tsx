import React, { createContext, useReducer, useEffect, type ReactNode } from 'react';
import { tokenManager, userManager, authAPI } from './auth';
import { useTranslation } from 'react-i18next';
import type { User } from './auth';
import type { AuthContextValue, LoginResult } from './useAuth.d';

/**
 * 认证状态接口
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Action 类型
 */
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_USER'; payload: User | null };

/**
 * AuthProvider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

// 初始状态
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

/**
 * Reducer 函数
 */
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };

    default:
      return state;
  }
};

// 创建 Context
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * AuthProvider 组件
 * 
 * 提供认证上下文，管理用户认证状态
 * 
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { t } = useTranslation();

  // 初始化时检查本地存储的认证信息
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenManager.getToken();
      const user = userManager.getUser();

      if (token && user) {
        try {
          // 验证 token 是否仍然有效
          const response = await authAPI.getCurrentUser();
          if (response.success) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user: response.user, token },
            });
            tokenManager.setToken(token);
            userManager.setUser(response.user);
          } else {
            // Token 无效，清除本地存储
            tokenManager.clearToken();
            userManager.setUser(null);
            dispatch({ type: 'LOGOUT' });
          }
        } catch {
          // Token 验证失败，清除本地存储
          tokenManager.clearToken();
          userManager.setUser(null);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  /**
   * 登录函数
   */
  const login = async (username: string, password: string): Promise<LoginResult> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const response = await authAPI.login(username, password);

      if (response.success) {
        const { token, user } = response;

        // 保存到本地存储
        tokenManager.setToken(token);
        userManager.setUser(user);

        // 更新状态
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token },
        });

        return { success: true };
      } else {
        throw new Error(response.message ?? t('auth.loginFailed'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('auth.loginFailed');
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * 登出函数
   */
  const logout = (): void => {
    authAPI.logout();
    dispatch({ type: 'LOGOUT' });
  };

  /**
   * 清除错误
   */
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  /**
   * 检查权限
   */
  const hasPermission = (requiredRole: 'reader' | 'editor'): boolean => {
    if (!state.user) return false;

    if (requiredRole === 'reader') {
      return state.user.role === 'reader' || state.user.role === 'editor';
    }
    if (requiredRole === 'editor') {
      return state.user.role === 'editor';
    }
    return false;
  };

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    clearError,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 导出 AuthContext 以便在其他文件中使用
export default AuthContext;
