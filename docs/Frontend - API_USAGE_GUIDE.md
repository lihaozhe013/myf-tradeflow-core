# API Hook 使用指南

## 概述

我们提供了两个主要的Hook来简化API调用和认证处理：

- `useApi` - 通用API请求Hook
- `useApiData` - 专门用于数据获取的Hook

## 导入方式

```javascript
import { useApi, useApiData } from '../hooks/useApi';
```

## 1. useApi Hook

适用于手动触发的API调用（如按钮点击、表单提交等）

### 基本用法

```javascript
import { useApi } from '../hooks/useApi';

const MyComponent = () => {
  const { loading, error, get, post, put, delete: del } = useApi();

  const handleSubmit = async () => {
    try {
      const result = await post('/users', { name: 'John', email: 'john@example.com' });
      console.log('创建成功:', result);
    } catch (err) {
      // 错误已自动显示，这里可以做额外处理
      console.error('创建失败:', err);
    }
  };

  return (
    <Button loading={loading} onClick={handleSubmit}>
      提交
    </Button>
  );
};
```

### 可用方法

- `get(url, options)` - GET请求
- `post(url, data, options)` - POST请求
- `put(url, data, options)` - PUT请求
- `delete(url, options)` - DELETE请求
- `upload(url, formData, options)` - 文件上传
- `download(url, filename, options)` - 文件下载

### 选项参数

```javascript
const options = {
  silent: true,  // 不自动显示错误消息
  headers: {     // 自定义请求头
    'Custom-Header': 'value'
  }
};
```

## 2. useApiData Hook

适用于组件加载时自动获取数据

### 基本用法

```javascript
import { useApiData } from '../hooks/useApi';

const UserList = () => {
  const { data: users, loading, error, refresh } = useApiData('/users');

  if (loading) return <Spin />;
  if (error) return <Alert message={error} type="error" />;

  return (
    <div>
      <Button onClick={refresh}>刷新</Button>
      <List
        dataSource={users}
        renderItem={user => <List.Item>{user.name}</List.Item>}
      />
    </div>
  );
};
```

### 高级配置

```javascript
const { data, loading, error, refresh } = useApiData('/users', {
  immediate: true,        // 是否立即加载（默认true）
  defaultData: [],        // 默认数据
  onSuccess: (data) => {  // 成功回调
    console.log('数据获取成功:', data);
  },
  onError: (error) => {   // 错误回调
    console.error('数据获取失败:', error);
  }
});
```

## 3. 实际应用示例

### 用户管理组件

```javascript
import React, { useState } from 'react';
import { Button, Table, Modal, Form, Input, message } from 'antd';
import { useApi, useApiData } from '../hooks/useApi';

const UserManagement = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  // 获取用户列表
  const { 
    data: users, 
    loading: usersLoading, 
    refresh: refreshUsers 
  } = useApiData('/users');
  
  // API操作方法
  const { loading: actionLoading, post, put, delete: deleteUser } = useApi();

  // 创建用户
  const handleCreate = async (values) => {
    try {
      await post('/users', values);
      message.success('用户创建成功');
      setIsModalVisible(false);
      form.resetFields();
      refreshUsers(); // 刷新列表
    } catch (error) {
      // 错误已自动处理
    }
  };

  // 删除用户
  const handleDelete = async (userId) => {
    try {
      await deleteUser(`/users/${userId}`);
      message.success('用户删除成功');
      refreshUsers(); // 刷新列表
    } catch (error) {
      // 错误已自动处理
    }
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          danger 
          loading={actionLoading}
          onClick={() => handleDelete(record.id)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Button 
        type="primary" 
        onClick={() => setIsModalVisible(true)}
        style={{ marginBottom: 16 }}
      >
        添加用户
      </Button>
      
      <Table 
        columns={columns} 
        dataSource={users || []} 
        loading={usersLoading}
        rowKey="id"
      />

      <Modal
        title="添加用户"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate}>
          <Form.Item name="name" rules={[{ required: true }]}>
            <Input placeholder="用户名" />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="邮箱" />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={actionLoading}
              block
            >
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
```

### 数据统计组件

```javascript
import React from 'react';
import { Card, Statistic, Button, Row, Col } from 'antd';
import { useApi, useApiData } from '../hooks/useApi';

const Dashboard = () => {
  // 自动获取统计数据
  const { 
    data: stats, 
    loading, 
    error, 
    refresh 
  } = useApiData('/dashboard/stats', {
    defaultData: {}
  });

  // 手动刷新操作
  const { post } = useApi();
  
  const handleRefreshStats = async () => {
    try {
      await post('/dashboard/refresh');
      await refresh(); // 重新获取数据
    } catch (error) {
      // 错误已自动处理
    }
  };

  if (error) {
    return (
      <Card>
        <p>数据加载失败</p>
        <Button onClick={refresh}>重试</Button>
      </Card>
    );
  }

  return (
    <div>
      <Button 
        onClick={handleRefreshStats} 
        style={{ marginBottom: 16 }}
      >
        刷新数据
      </Button>
      
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers || 0}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers || 0}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="今日订单"
              value={stats.todayOrders || 0}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
```

## 4. 特性

### 自动认证
- 所有请求自动携带JWT token
- 401错误自动登出并重定向到登录页
- 403错误自动显示权限不足提示

### 错误处理
- 自动显示错误消息（可通过`silent: true`关闭）
- 网络错误、服务器错误的统一处理
- 错误状态的自动管理

### 加载状态
- 自动管理loading状态
- 支持全局loading指示器

### 数据缓存
- useApiData支持数据缓存
- 手动刷新机制

## 5. 最佳实践

1. **数据获取使用useApiData**：组件加载时需要显示的数据
2. **操作使用useApi**：用户交互触发的API调用
3. **错误处理**：重要操作可以添加try-catch进行额外处理
4. **加载状态**：利用返回的loading状态显示加载指示器
5. **数据刷新**：使用refresh方法而不是重新请求

这样的设计让每个组件都能轻松使用带认证的API调用，同时保持代码简洁和一致性。
