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
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(''); // 新增
  const [downloadFile, setDownloadFile] = useState(null); // 新增

  // Python导出功能
  const handlePythonExport = async (exportType, params) => {
    try {
      setLoading(true);
      setDownloadFile(null); // 每次导出前清空
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
        // 只取文件名部分
        if (result.file_path) {
          const fileName = result.file_path.split(/[\\/]/).pop();
          setDownloadFile(fileName);
        }
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
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            downloadFile={downloadFile} // 传递给子组件
        />
        {downloadFile && (
          <div style={{marginTop: 16}}>
            <a
              href={`/exported-files/${encodeURIComponent(downloadFile)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button type="primary" icon={<FileExcelOutlined />}>下载导出文件</Button>
            </a>
          </div>
        )}
    </div>
  );
};

export default Report;
