import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  message,
  Tabs
} from 'antd';
import dayjs from 'dayjs';

import ReportViewer from './components/ReportViewer';
import ExportPanel from './components/ExportPanel';
import { getReportTitle, getColumns, exportToCSV, exportToExcel } from './utils/reportUtils.jsx';

const { Title } = Typography;
const { TabPane } = Tabs;

const Report = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('inbound');
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(1, 'month'),
    dayjs()
  ]);
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [activeTab, setActiveTab] = useState('view');

  // 获取合作伙伴列表
  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners');
      if (response.ok) {
        const result = await response.json();
        setPartners(Array.isArray(result.data) ? result.data : []);
      } else {
        console.error('获取合作伙伴列表失败');
        setPartners([]);
      }
    } catch (error) {
      console.error('获取合作伙伴列表失败:', error);
      setPartners([]);
    }
  };

  // 获取产品列表
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const result = await response.json();
        setProducts(Array.isArray(result.data) ? result.data : []);
      } else {
        console.error('获取产品列表失败');
        setProducts([]);
      }
    } catch (error) {
      console.error('获取产品列表失败:', error);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchPartners();
    fetchProducts();
  }, []);

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

  // 生成报表
  const generateReport = async () => {
    try {
      setLoading(true);
      let apiUrl = '';
      const params = new URLSearchParams();
      
      // 根据报表类型选择对应的API端点
      if (reportType === 'stock') {
        apiUrl = '/api/reports/stock';
      } else if (reportType === 'inbound' || reportType === 'outbound') {
        apiUrl = '/api/reports/inout';
        params.append('start_date', dateRange[0].format('YYYY-MM-DD'));
        params.append('end_date', dateRange[1].format('YYYY-MM-DD'));
        if (selectedProduct) {
          params.append('product_model', selectedProduct);
        }
      } else if (reportType === 'finance') {
        apiUrl = '/api/reports/finance';
        params.append('start_date', dateRange[0].format('YYYY-MM-DD'));
        params.append('end_date', dateRange[1].format('YYYY-MM-DD'));
        params.append('group_by', 'month');
      } else {
        // 默认使用进出货报表
        apiUrl = '/api/reports/inout';
        params.append('start_date', dateRange[0].format('YYYY-MM-DD'));
        params.append('end_date', dateRange[1].format('YYYY-MM-DD'));
        if (selectedProduct) {
          params.append('product_model', selectedProduct);
        }
      }

      const url = params.toString() ? `${apiUrl}?${params}` : apiUrl;
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        let data = Array.isArray(result.data) ? result.data : [];
        
        // 如果是进出货报表，需要根据类型过滤数据
        if (reportType === 'inbound') {
          data = data.filter(item => item.type === 'inbound');
        } else if (reportType === 'outbound') {
          data = data.filter(item => item.type === 'outbound');
        }
        
        setReportData(data);
        message.success('报表生成成功');
      } else {
        message.error('报表生成失败');
      }
    } catch (error) {
      console.error('报表生成失败:', error);
      message.error('报表生成失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出报表
  const exportReport = (format) => {
    try {
      if (!reportData || reportData.length === 0) {
        message.warning('请先生成报表数据');
        return;
      }

      if (format === 'csv') {
        exportToCSV(reportData, getColumns, getReportTitle, reportType, dateRange);
        message.success('CSV导出成功');
      } else if (format === 'excel') {
        exportToExcel(reportData, getColumns, getReportTitle, reportType, dateRange);
        message.success('Excel导出成功');
      }
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>报表导出</Title>
          </Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="报表查看" key="view">
            <ReportViewer
              loading={loading}
              reportData={reportData}
              reportType={reportType}
              setReportType={setReportType}
              dateRange={dateRange}
              setDateRange={setDateRange}
              partners={partners}
              products={products}
              selectedPartner={selectedPartner}
              setSelectedPartner={setSelectedPartner}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              generateReport={generateReport}
              exportReport={exportReport}
              getReportTitle={() => getReportTitle(reportType)}
              getColumns={() => getColumns(reportType)}
            />
          </TabPane>
          
          <TabPane tab="高级导出" key="export">
            <ExportPanel
              handlePythonExport={handlePythonExport}
              loading={loading}
              dateRange={dateRange}
              setDateRange={setDateRange}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Report;
