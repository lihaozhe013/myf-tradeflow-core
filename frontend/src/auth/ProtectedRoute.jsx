import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import { useAuth } from './useAuth';
import { useTranslation } from 'react-i18next';

const ProtectedRoute = ({ 
  children, 
  requireRole = 'reader', // 默认需要 reader 权限
  fallback = null 
}) => {
  const { isAuthenticated, isLoading, hasPermission, user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

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
        title={t('auth.permission.deniedTitle')}
        subTitle={t('auth.permission.deniedSubTitle', {
          action: requireRole === 'editor' ? t('common.edit') : t('auth.permission.view'),
          role: user?.role === 'reader' ? t('auth.roles.reader') : t('auth.roles.editor')
        })}
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            {t('auth.back')}
          </Button>
        }
      />
    );
  }

  // 权限验证通过，渲染子组件
  return children || fallback;
};

export default ProtectedRoute;
