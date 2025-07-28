import React, { useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  message,
  Tabs,
  Button
} from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
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
  const [paymentDateRange, setPaymentDateRange] = useState([
    dayjs().subtract(1, 'month'),
    dayjs()
  ]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');

  // 生成文件名
  const generateFilename = (exportType) => {
    const timestamp = dayjs().format('YYYYMMDD_HHmmss');
    const typeMap = {
      'base-info': '基础信息导出',
      'inbound-outbound': '入库出库记录导出',
      'receivable-payable': '应收应付明细导出',
      'invoice': '发票导出'
    };
    const typeName = typeMap[exportType] || exportType;
    return `${typeName}_${timestamp}.xlsx`;
  };

  // Node.js导出功能 - 直接下载
  const handleExport = async (exportType, params) => {
    try {
      setLoading(true);
      message.loading('正在生成Excel文件...', 0.5);
      
      const response = await fetch(`/api/export/${exportType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (response.ok) {
        // 获取文件数据
        const blob = await response.blob();
        
        // 检查文件大小
        if (blob.size === 0) {
          message.warning('导出的文件为空，请检查筛选条件或数据');
          return;
        }
        
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generateFilename(exportType);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        const fileSizeKB = (blob.size / 1024).toFixed(1);
        message.success(`导出成功！文件大小：${fileSizeKB}KB，已开始下载`);
      } else {
        const error = await response.json();
        message.error(`导出失败：${error.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('导出失败:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        message.error('网络连接失败，请检查服务器状态');
      } else {
        message.error(`导出失败：${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
        <ExportPanel
            handleExport={handleExport}
            loading={loading}
            dateRange={dateRange}
            setDateRange={setDateRange}
            paymentDateRange={paymentDateRange}
            setPaymentDateRange={setPaymentDateRange}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
        />
    </div>
  );
};

export default Report;
