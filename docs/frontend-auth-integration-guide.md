# 前端认证集成完整指南

## 📋 概述

本指南详细说明如何在现有React页面中集成JWT无状态认证，避免常见的无限循环和认证错误问题。

## 🔧 核心Hooks

### useSimpleApi - 手动API调用
```javascript
import { useSimpleApi } from '../hooks/useSimpleApi';

const MyComponent = () => {
  const apiInstance = useSimpleApi();
  
  const handleSave = async (data) => {
    try {
      await apiInstance.post('/endpoint', data);
      message.success('保存成功');
    } catch (error) {
      // 错误已自动处理
    }
  };
};
```

### useSimpleApiData - 自动数据加载
```javascript
import { useSimpleApiData } from '../hooks/useSimpleApi';

const MyComponent = () => {
  const { data: response } = useSimpleApiData('/partners', { data: [] });
  
  // ⚠️ 重要：总是提取data字段
  const partners = response?.data || [];
};
```

## 🚨 关键要点

### 1. API路径规范
```javascript
// ❌ 错误：不要添加/api前缀
await apiInstance.get('/api/partners');

// ✅ 正确：直接使用路径
await apiInstance.get('/partners');
```

### 2. 数据提取模式
```javascript
// API响应结构：{ data: [...] }
const { data: partnersResponse } = useSimpleApiData('/partners', { data: [] });
const partners = partnersResponse?.data || []; // 提取data字段
```

### 3. 避免无限循环的useCallback模式
```javascript
// ❌ 错误：会导致无限循环
const fetchData = useCallback(() => {
  // API调用
}, [apiInstance, filters, pagination]); // 对象引用不稳定

// ✅ 正确：提取稳定依赖
const supplierName = filters.supplier_name;
const currentPage = pagination.current;
const pageSize = pagination.pageSize;

const fetchData = useCallback(() => {
  // API调用
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [supplierName, currentPage, pageSize]); // 只使用原始值
```

## 📄 标准页面升级模板

### 主页面结构
```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { useSimpleApi, useSimpleApiData } from '../../hooks/useSimpleApi';

const MyPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    supplier_name: undefined,
    // 其他筛选条件
  });
  const [sorter, setSorter] = useState({
    field: undefined,
    order: undefined,
  });

  // 使用认证API
  const apiInstance = useSimpleApi();
  const { data: partnersResponse } = useSimpleApiData('/partners', { data: [] });
  
  // 提取data字段
  const partners = partnersResponse?.data || [];
  
  // 提取稳定依赖值
  const supplierName = filters.supplier_name;
  const sortField = sorter.field;
  const sortOrder = sorter.order;

  // 数据获取函数
  const fetchRecords = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const page = params.page !== undefined ? params.page : pagination.current;
      const pageSize = params.limit || pagination.pageSize;
      const supplierNameParam = params.supplier_name !== undefined ? params.supplier_name : supplierName;
      
      const query = new URLSearchParams({
        page,
        limit: pageSize,
        supplier_name: supplierNameParam || '',
        sort_field: params.sort_field || sortField || '',
        sort_order: params.sort_order || sortOrder || '',
      });
      
      const result = await apiInstance.get(`/my-endpoint?${query.toString()}`);
      setRecords(Array.isArray(result.data) ? result.data : []);
      setPagination(prev => ({
        ...prev,
        current: result.page || 1,
        total: result.total || 0,
      }));
    } catch (error) {
      console.error('获取数据失败:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierName, sortField, sortOrder]);

  // 页面加载时获取数据
  useEffect(() => {
    fetchRecords({ page: 1 });
  }, [fetchRecords]);

  // CRUD操作
  const handleSave = async (values) => {
    try {
      if (editingRecord) {
        await apiInstance.put(`/my-endpoint/${editingRecord.id}`, values);
      } else {
        await apiInstance.post('/my-endpoint', values);
      }
      message.success('保存成功');
      fetchRecords();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiInstance.delete(`/my-endpoint/${id}`);
      message.success('删除成功');
      fetchRecords();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  return (
    // JSX内容
  );
};
```

### 子组件升级（如Table组件）
```javascript
const MyTable = ({
  data,
  loading,
  onEdit,
  onDelete,
  apiInstance // 接收API实例
}) => {
  // 子组件中的API调用
  const fetchDetails = async (id) => {
    try {
      const result = await apiInstance.get(`/details/${id}`);
      // 处理结果
    } catch (error) {
      console.error('获取详情失败:', error);
    }
  };

  return (
    // Table JSX
  );
};

// 在父组件中传递API实例
<MyTable
  data={records}
  loading={loading}
  onEdit={handleEdit}
  onDelete={handleDelete}
  apiInstance={apiInstance}
/>
```

## 🔐 认证特性

### 自动认证处理
- **JWT Token**: 自动在请求头添加 `Authorization: Bearer <token>`
- **401错误**: 自动清除token并跳转登录页
- **403错误**: 自动显示权限不足提示

### 文件下载
```javascript
const { postBlob } = useSimpleApi();

const handleExport = async (data) => {
  try {
    const blob = await postBlob('/export/my-data', data);
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'export.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    message.success('导出成功');
  } catch (error) {
    console.error('导出失败:', error);
  }
};
```

## ⚠️ 常见错误及解决方案

### 1. 无限API调用循环
**原因**: useCallback依赖数组中使用不稳定的对象引用

**解决方案**:
```javascript
// ❌ 错误
const fetchData = useCallback(() => {}, [apiInstance, filters, sorter]);

// ✅ 正确
const supplierName = filters.supplier_name;
const sortField = sorter.field;
const fetchData = useCallback(() => {
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [supplierName, sortField]);
```

### 2. 401认证错误
**原因**: 组件中仍有直接的fetch调用

**解决方案**: 全部替换为认证API实例
```javascript
// ❌ 错误
const response = await fetch('/api/data');

// ✅ 正确
const result = await apiInstance.get('/data');
```

### 3. 数据未正确显示
**原因**: 未提取API响应的data字段

**解决方案**:
```javascript
// API响应: { data: [...], total: 100 }
const { data: response } = useSimpleApiData('/endpoint', { data: [] });
const actualData = response?.data || []; // 提取data字段
```

## 🎯 升级检查清单

### 页面级别
- [ ] 导入 `useSimpleApi` 和 `useSimpleApiData`
- [ ] 移除所有直接的 `fetch` 调用
- [ ] API路径移除 `/api` 前缀
- [ ] 正确提取响应数据的 `data` 字段
- [ ] useCallback使用稳定依赖

### 组件级别  
- [ ] 子组件接收并使用 `apiInstance` 参数
- [ ] 移除组件内的直接API调用
- [ ] 文件下载使用 `postBlob` 方法

### 功能验证
- [ ] 页面加载正常显示数据
- [ ] CRUD操作功能正常
- [ ] 筛选和分页工作正常
- [ ] 无401认证错误
- [ ] 无无限循环调用
- [ ] Modal和详情弹窗正常显示

## 🔄 完成的页面

### ✅ 已升级页面
1. **Overview** - 总览页面
2. **Stock** - 库存管理
3. **Products** - 产品管理  
4. **Partners** - 合作伙伴管理
5. **ProductPrices** - 产品价格管理
6. **Inbound** - 入库管理
7. **Outbound** - 出库管理
8. **Payable** - 应付账款管理
9. **Receivable** - 应收账款管理
10. **Analysis** - 数据分析

所有页面均已完成认证集成，支持JWT无状态认证，无无限循环问题。

---

**最后更新**: 2025年8月20日  
**状态**: 前端认证升级完成
