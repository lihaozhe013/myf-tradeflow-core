import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { tokenManager, userManager, authAPI } from './auth';

// 初始状态
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_USER: 'SET_USER',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case AUTH_ACTIONS.SET_USER:
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
const AuthContext = createContext(null);

// AuthProvider 组件
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初始化时检查本地存储的认证信息
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenManager.getToken();
      const user = userManager.getUser();
      
      if (token && user) {
        try {
          // 验证token是否仍然有效
          const response = await authAPI.getCurrentUser();
          if (response.success) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { user: response.user, token }
            });
            tokenManager.setToken(token);
            userManager.setUser(response.user);
          } else {
            // Token无效，清除本地存储
            tokenManager.clearToken();
            userManager.setUser(null);
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        } catch (error) {
          // Token验证失败，清除本地存储
          tokenManager.clearToken();
          userManager.setUser(null);
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initAuth();
  }, []);

  // 登录函数
  const login = async (username, password) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    
    try {
      const response = await authAPI.login(username, password);
      
      if (response.success) {
        const { token, user } = response;
        
        // 保存到本地存储
        tokenManager.setToken(token);
        userManager.setUser(user);
        
        // 更新状态
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token }
        });
        
        return { success: true };
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message
      });
      return { success: false, error: error.message };
    }
  };

  // 登出函数
  const logout = () => {
    authAPI.logout();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // 清除错误
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // 检查权限
  const hasPermission = (requiredRole) => {
    if (!state.user) return false;
    
    if (requiredRole === 'reader') {
      return state.user.role === 'reader' || state.user.role === 'editor';
    }
    if (requiredRole === 'editor') {
      return state.user.role === 'editor';
    }
    return false;
  };

  const value = {
    ...state,
    login,
    logout,
    clearError,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
