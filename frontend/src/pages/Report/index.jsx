import React, { useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  message,
  Tabs
} from 'antd';
import dayjs from 'dayjs';
import ExportPanel from './components/ExportPanel';

const { Title } = Typography;
const { TabPane } = Tabs;

const Report = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(1, 'month'),
    dayjs()
  ]);
  const [selectedProduct, setSelectedProduct] = useState('');

  // Python导出功能
  const handlePythonExport = async (exportType, params) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/export/${exportType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success(`导出成功！文件：${result.file_path}`);
        // 可以添加文件下载链接或进一步处理
      } else {
        message.error(`导出失败：${result.message}`);
      }
    } catch (error) {
      console.error('导出失败:', error);
      message.error(`导出失败：${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
        <ExportPanel
            handlePythonExport={handlePythonExport}
            loading={loading}
            dateRange={dateRange}
            setDateRange={setDateRange}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
        />
    </div>
  );
};

export default Report;
