# 前端组件设计规范

## 组件化架构原则

### 单一职责原则
每个组件只负责一个特定功能：
- **主组件** (`index.jsx`): 状态管理和业务逻辑
- **表格组件**: 数据展示和基础操作
- **筛选组件**: 筛选条件输入
- **弹窗组件**: 表单输入和编辑

### 组件层级结构
```
页面模块/
├── index.jsx              # 主组件 - 业务逻辑中心
├── components/            # 子组件目录
│   ├── XXXTable.jsx      # 表格组件
│   ├── XXXModal.jsx      # 弹窗组件  
│   ├── XXXFilter.jsx     # 筛选组件
│   └── XXXDetail.jsx     # 详情组件
└── hooks/                # 自定义钩子(可选)
    ├── useXXXData.js     # 数据管理钩子
    └── useXXXExport.js   # 导出功能钩子
```

## 标准组件模板

### 主组件模板
```javascript
// pages/Module/index.jsx
import React, { useState, useCallback } from 'react';
import { Card, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSimpleApi, useSimpleApiData } from '../../hooks/useSimpleApi';

import ModuleTable from './components/ModuleTable';
import ModuleModal from './components/ModuleModal';
import ModuleFilter from './components/ModuleFilter';

const ModuleManagement = () => {
  const { t } = useTranslation();
  const { get, post, put, delete: del } = useSimpleApi();
  
  // 状态管理
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [filterParams, setFilterParams] = useState({});
  
  // 数据获取
  const { data, loading, error, refetch } = useSimpleApiData(
    `/api/module?${new URLSearchParams(filterParams)}`
  );
  
  // 业务逻辑方法
  const handleCreate = useCallback(() => {
    setCurrentRecord(null);
    setModalVisible(true);
  }, []);
  
  const handleEdit = useCallback((record) => {
    setCurrentRecord(record);
    setModalVisible(true);
  }, []);
  
  const handleDelete = useCallback(async (id) => {
    try {
      await del(`/api/module/${id}`);
      message.success(t('module.deleteSuccess'));
      refetch();
    } catch (error) {
      // 错误已由useSimpleApi处理
    }
  }, [del, t, refetch]);
  
  const handleSave = useCallback(async (values) => {
    try {
      if (currentRecord) {
        await put(`/api/module/${currentRecord.id}`, values);
        message.success(t('module.updateSuccess'));
      } else {
        await post('/api/module', values);
        message.success(t('module.createSuccess'));
      }
      setModalVisible(false);
      refetch();
    } catch (error) {
      // 错误已由useSimpleApi处理
    }
  }, [currentRecord, post, put, t, refetch]);
  
  return (
    <Card title={t('module.title')}>
      <ModuleFilter 
        onFilter={setFilterParams}
        onCreate={handleCreate}
      />
      
      <ModuleTable
        data={data?.data || []}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      
      <ModuleModal
        visible={modalVisible}
        record={currentRecord}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
      />
    </Card>
  );
};

export default ModuleManagement;
```

### 表格组件模板
```javascript
// components/ModuleTable.jsx
import React from 'react';
import { Table, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const ModuleTable = ({ data, loading, onEdit, onDelete }) => {
  const { t } = useTranslation();
  
  const columns = [
    {
      title: t('module.field1'),
      dataIndex: 'field1',
      key: 'field1',
      sorter: true,
    },
    {
      title: t('module.field2'),
      dataIndex: 'field2',
      key: 'field2',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            size="small"
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('common.confirmDelete')}
            onConfirm={() => onDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => t('common.totalItems', { total }),
      }}
    />
  );
};

export default ModuleTable;
```

### 弹窗组件模板
```javascript
// components/ModuleModal.jsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker } from 'antd';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

const ModuleModal = ({ visible, record, onCancel, onOk }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  
  useEffect(() => {
    if (visible) {
      if (record) {
        form.setFieldsValue(record);
      } else {
        form.resetFields();
      }
    }
  }, [visible, record, form]);
  
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
    } catch (error) {
      // 表单验证失败
    }
  };
  
  return (
    <Modal
      title={record ? t('module.edit') : t('module.create')}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="field1"
          label={t('module.field1')}
          rules={[
            { required: true, message: t('module.field1Required') }
          ]}
        >
          <Input placeholder={t('module.field1Placeholder')} />
        </Form.Item>
        
        <Form.Item
          name="field2"
          label={t('module.field2')}
        >
          <Select placeholder={t('module.field2Placeholder')}>
            <Option value="option1">{t('module.option1')}</Option>
            <Option value="option2">{t('module.option2')}</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModuleModal;
```

## 钩子使用规范

### 认证API钩子
```javascript
// 简化版钩子(推荐)
import { useSimpleApi, useSimpleApiData } from '../../hooks/useSimpleApi';

// 数据获取
const { data, loading, error, refetch } = useSimpleApiData('/api/endpoint');

// API操作  
const { get, post, put, delete: del } = useSimpleApi();
```

### 自定义钩子模板
```javascript
// hooks/useModuleData.js
import { useState, useCallback } from 'react';
import { useSimpleApi } from '../hooks/useSimpleApi';

export const useModuleData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { get } = useSimpleApi();
  
  const fetchData = useCallback(async (params) => {
    setLoading(true);
    try {
      const result = await get(`/api/module?${new URLSearchParams(params)}`);
      setData(result.data || []);
    } catch (error) {
      // 错误已处理
    } finally {
      setLoading(false);
    }
  }, [get]);
  
  return {
    data,
    loading,
    fetchData,
    refetchData: () => fetchData({})
  };
};
```

## 状态管理规范

### 本地状态管理
```javascript
// 使用useState管理组件状态
const [loading, setLoading] = useState(false);
const [visible, setVisible] = useState(false);
const [currentRecord, setCurrentRecord] = useState(null);

// 使用useCallback优化性能
const handleAction = useCallback((param) => {
  // 处理逻辑
}, [dependency]);
```

### 跨组件状态传递
```javascript
// 通过Props传递状态
<ChildComponent
  data={data}
  loading={loading}
  onAction={handleAction}
/>

// 通过Context共享状态(大型应用)
const ModuleContext = createContext();
```

## 样式规范

### 内联样式
```javascript
// 简单样式使用内联
<div style={{ marginBottom: 16, textAlign: 'center' }}>
  内容
</div>
```

### CSS类名规范
```css
/* 模块前缀 + 功能描述 */
.module-header { }
.module-table { }
.module-filter { }
.module-modal { }
```

### 响应式设计
```javascript
// 使用Ant Design的栅格系统
<Row gutter={16}>
  <Col xs={24} sm={12} md={8} lg={6}>
    内容
  </Col>
</Row>
```

## 表单处理规范

### 表单验证
```javascript
// 统一验证规则
const validationRules = {
  required: { required: true, message: t('field.required') },
  email: { type: 'email', message: t('field.emailInvalid') },
  phone: { pattern: /^1[3-9]\d{9}$/, message: t('field.phoneInvalid') }
};

// 表单字段配置
<Form.Item
  name="email"
  label={t('user.email')}
  rules={[validationRules.required, validationRules.email]}
>
  <Input />
</Form.Item>
```

### AutoComplete组件
```javascript
// 智能输入组件
import { AutoComplete } from 'antd';

const SmartInput = ({ options, onSelect, placeholder }) => {
  const [value, setValue] = useState('');
  
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(value.toLowerCase()) ||
    option.value.toLowerCase().includes(value.toLowerCase())
  );
  
  return (
    <AutoComplete
      value={value}
      options={filteredOptions}
      onSelect={onSelect}
      onChange={setValue}
      placeholder={placeholder}
      filterOption={false}
    />
  );
};
```

## 错误处理规范

### 统一错误处理
```javascript
// API错误由钩子自动处理
const { get, post } = useSimpleApi();

try {
  const result = await post('/api/endpoint', data);
  // 成功处理
  message.success(t('operation.success'));
} catch (error) {
  // 错误已由useSimpleApi自动显示
  // 可选：额外的错误处理逻辑
}
```

### 表单错误处理
```javascript
// 表单验证错误
const handleSubmit = async () => {
  try {
    const values = await form.validateFields();
    await onSubmit(values);
  } catch (error) {
    if (error.errorFields) {
      // 表单验证错误
      message.error(t('form.validationError'));
    }
  }
};
```

## 性能优化

### 组件优化
```javascript
// 使用React.memo避免不必要的重渲染
const TableComponent = React.memo(({ data, onEdit }) => {
  // 组件内容
});

// 使用useCallback优化函数引用
const handleEdit = useCallback((record) => {
  setCurrentRecord(record);
  setModalVisible(true);
}, []);
```

### 数据加载优化
```javascript
// 懒加载组件
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// 分页加载
const [pagination, setPagination] = useState({
  current: 1,
  pageSize: 10,
  total: 0
});
```

## 测试友好设计

### 测试ID添加
```javascript
// 添加data-testid便于测试
<Button 
  data-testid="create-button"
  onClick={handleCreate}
>
  {t('common.create')}
</Button>
```

### 组件导出
```javascript
// 导出组件和测试所需的工具
export default ModuleManagement;
export { ModuleTable, ModuleModal }; // 便于单元测试
```

---

*本文档最后更新: 2025年8月*
