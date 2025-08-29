import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import apiRequest from '../utils/request';
import { useAuth } from '../auth/AuthContext';

/**
 * 通用API请求Hook
 * 自动处理加载状态、错误处理、认证等
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { logout } = useAuth();

  // 通用请求方法
  const request = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest(url, options);
      return response;
    } catch (err) {
      setError(err.message);
      
      // 如果是认证错误，自动登出
      if (err.message.includes('认证失败')) {
        message.error('登录已过期，请重新登录');
        logout();
        return null;
      }
      
      // 显示错误消息（可以通过配置关闭）
      if (!options.silent) {
        message.error(err.message);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // GET请求
  const get = useCallback(async (url, options = {}) => {
    return await request(url, { method: 'GET', ...options });
  }, [request]);

  // POST请求
  const post = useCallback(async (url, data, options = {}) => {
    return await request(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }, [request]);

  // PUT请求
  const put = useCallback(async (url, data, options = {}) => {
    return await request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }, [request]);

  // DELETE请求
  const del = useCallback(async (url, options = {}) => {
    return await request(url, { method: 'DELETE', ...options });
  }, [request]);

  // 文件上传
  const upload = useCallback(async (url, formData, options = {}) => {
    return await request(url, {
      method: 'POST',
      body: formData,
      headers: {
        // 不设置Content-Type，让浏览器自动设置
        ...options.headers,
        'Content-Type': undefined,
      },
      ...options
    });
  }, [request]);

  // 文件下载
  const download = useCallback(async (url, filename, options = {}) => {
    try {
      setLoading(true);
      const response = await apiRequest(url, { ...options });
      
      if (response instanceof Response) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        message.success('文件下载成功');
      }
    } catch (err) {
      message.error(`下载失败: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    delete: del,
    upload,
    download,
    // 清除错误状态
    clearError: () => setError(null)
  };
};

/**
 * 专门用于数据获取的Hook
 * 支持自动加载、重试、缓存等功能
 */
export const useApiData = (url, options = {}) => {
  const {
    immediate = true,  // 是否立即加载
    onSuccess,         // 成功回调
    onError,           // 错误回调
    defaultData = null // 默认数据
  } = options;

  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { get, post } = useApi();

  // 使用 ref 存储回调函数，避免依赖项变化
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  
  // 更新 ref
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  // 获取数据方法
  const fetchData = useCallback(async (autoCreate = true) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await get(url, { silent: true });
      
      // 处理503状态 - 数据未生成，尝试自动创建
      if (response?.status === 503 && autoCreate) {
        await post(url.replace('GET', 'POST'), {});
        return await fetchData(false);
      }
      
      setData(response || defaultData);
      onSuccessRef.current?.(response);
      return response;
    } catch (err) {
      setError(err.message);
      onErrorRef.current?.(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [url, get, post, defaultData]); // 移除 onSuccess 和 onError

  // 刷新数据
  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  // 立即加载数据
  useEffect(() => {
    if (immediate && url) {
      fetchData();
    }
  }, [immediate, url, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    fetchData,
    setData,
    clearError: () => setError(null)
  };
};

export default useApi;
