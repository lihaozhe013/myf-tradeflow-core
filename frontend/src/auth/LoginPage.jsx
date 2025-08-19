import React, { useState } from 'react';
import { Form, Input, Button, Card, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const [form] = Form.useForm();
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginLoading, setLoginLoading] = useState(false);

  // 获取重定向路径
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (values) => {
    setLoginLoading(true);
    clearError();
    
    try {
      const result = await login(values.username, values.password);
      
      if (result.success) {
        // 登录成功，重定向到之前的页面或首页
        navigate(from, { replace: true });
      }
    } catch (err) {
      // 错误已经在 AuthContext 中处理
    } finally {
      setLoginLoading(false);
    }
  };

  const handleUsernameChange = () => {
    // 清除错误信息当用户开始输入时
    if (error) {
      clearError();
    }
  };

  if (isLoading) {
    return (
      <div className="login-container">
        <div className="login-loading">
          <Spin size="large" />
          <p>正在验证登录状态...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <Card className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <img src="/logo.svg" alt="Logo" className="logo-image" />
            </div>
            <h1 className="login-title">轻量级 ERP 系统</h1>
            <p className="login-subtitle">请登录您的账户</p>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={clearError}
              style={{ marginBottom: 24 }}
            />
          )}

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                {
                  required: true,
                  message: '请输入用户名',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                onChange={handleUsernameChange}
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: '请输入密码',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="login-button"
                loading={loginLoading}
                icon={<LoginOutlined />}
                block
              >
                {loginLoading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>

          {/* <div className="login-footer">
            <p className="login-tips">
              默认账户: adminn / admin123
            </p>
          </div> */}
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
