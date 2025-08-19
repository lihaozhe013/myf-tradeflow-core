import { tokenManager } from '../auth/auth';

// 创建一个请求工具函数，自动添加认证头
const createRequest = (baseURL = '') => {
  const request = async (url, options = {}) => {
    const token = tokenManager.getToken();
    const { responseType, ...fetchOptions } = options;
    
    // 默认配置
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    };

    // 添加认证头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const fullUrl = `${baseURL}${url}`;
    
    try {
      const response = await fetch(fullUrl, config);
      
      // 处理 401 错误（token过期或无效）
      if (response.status === 401) {
        // 清除本地存储的认证信息
        tokenManager.clearToken();
        
        // 重定向到登录页（如果当前不在登录页）
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        throw new Error('认证失败，请重新登录');
      }
      
      // 处理 403 错误（权限不足）
      if (response.status === 403) {
        throw new Error('权限不足，无法执行此操作');
      }
      
      // 处理其他错误状态码
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }
      
      // 根据responseType处理响应
      if (responseType === 'blob') {
        return await response.blob();
      }
      
      // 尝试解析 JSON 响应
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      // 对于非 JSON 响应（如文件下载），返回 response 对象
      return response;
      
    } catch (error) {
      // 网络错误或其他错误
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('网络错误，请检查您的网络连接');
      }
      throw error;
    }
  };

  // 便捷方法
  request.get = (url, options = {}) => request(url, { method: 'GET', ...options });
  
  request.post = (url, data, options = {}) => request(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
  
  request.put = (url, data, options = {}) => request(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
  
  request.delete = (url, options = {}) => request(url, { method: 'DELETE', ...options });
  
  // 文件上传
  request.upload = (url, formData, options = {}) => request(url, {
    method: 'POST',
    body: formData,
    headers: {
      // 不设置 Content-Type，让浏览器自动设置（包含 boundary）
      ...options.headers,
      'Content-Type': undefined,
    },
    ...options,
  });
  
  // 文件下载
  request.download = async (url, filename, options = {}) => {
    const response = await request(url, { ...options });
    
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
    }
  };

  return request;
};

// 创建默认的 API 请求实例
export const apiRequest = createRequest('/api');

// 导出 createRequest 函数供其他模块使用
export { createRequest };

export default apiRequest;
