import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import apiRequest from '../utils/request';

/**
 * 简化版的API数据获取Hook
 * 避免无限循环问题
 */
export const useSimpleApiData = (url, defaultData = null) => {
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 使用ref来稳定defaultData，避免依赖变化导致的无限循环
  const stableDefaultData = useRef(defaultData);
  
  // 只在第一次时设置，后续不再更新
  if (stableDefaultData.current === null && defaultData !== null) {
    stableDefaultData.current = defaultData;
  }

  const fetchData = useCallback(async () => {
    if (!url) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(url);
      setData(response || stableDefaultData.current);
    } catch (err) {
      setError(err.message);
      console.error(`API调用失败 [${url}]:`, err);
    } finally {
      setLoading(false);
    }
  }, [url]); // 只依赖URL

  // 只在URL变化时重新获取数据
  useEffect(() => {
    fetchData();
  }, [fetchData]); // 包含fetchData依赖

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * 简化版的API操作Hook
 */
export const useSimpleApi = () => {
  const [loading, setLoading] = useState(false);

  const request = useCallback(async (url, options = {}) => {
    try {
      setLoading(true);
      const response = await apiRequest(url, options);
      return response;
    } catch (err) {
      message.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestBlob = useCallback(async (url, options = {}) => {
    try {
      setLoading(true);
      const response = await apiRequest(url, { ...options, responseType: 'blob' });
      return response;
    } catch (err) {
      message.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url, options = {}) => {
    return request(url, { method: 'GET', ...options });
  }, [request]);

  const post = useCallback((url, data, options = {}) => {
    return request(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }, [request]);

  const postBlob = useCallback((url, data, options = {}) => {
    return requestBlob(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }, [requestBlob]);

  const put = useCallback((url, data, options = {}) => {
    return request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }, [request]);

  const del = useCallback((url, options = {}) => {
    return request(url, { method: 'DELETE', ...options });
  }, [request]);

  return {
    loading,
    get,
    post,
    postBlob,
    put,
    delete: del,
    request
  };
};

export default useSimpleApiData;
