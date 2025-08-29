import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ 
  children, 
  requireRole = 'reader', // 默认需要 reader 权限
  fallback = null 
}) => {
  const { isAuthenticated, isLoading, hasPermission, user } = useAuth();
  const location = useLocation();

  // 正在加载认证状态
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // 未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已登录但权限不足
  if (!hasPermission(requireRole)) {
    return (
      <Result
        status="403"
        title="权限不足"
        subTitle={`抱歉，您需要 ${requireRole === 'editor' ? '编辑' : '查看'} 权限才能访问此页面。当前角色：${user?.role === 'reader' ? '只读用户' : user?.role}`}
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        }
      />
    );
  }

  // 权限验证通过，渲染子组件
  return children || fallback;
};

export default ProtectedRoute;
