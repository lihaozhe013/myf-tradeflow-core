import { useState, useCallback, useEffect, useMemo } from 'react';
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

  const fetchData = useCallback(async () => {
    if (!url) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(url);
      setData(response || defaultData);
    } catch (err) {
      setError(err.message);
      console.error(`API调用失败 [${url}]:`, err);
    } finally {
      setLoading(false);
    }
  }, [url, defaultData]);

  // 只在URL变化时重新获取数据
  useEffect(() => {
    fetchData();
  }, [url]); // 只依赖URL

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

  return {
    loading,
    get,
    post,
    request
  };
};

export default useSimpleApiData;
