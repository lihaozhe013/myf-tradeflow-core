import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Divider,
  Button,
  DatePicker,
  Select,
  Space,
  message,
  Table,
  Spin
} from 'antd';
import { DownloadOutlined, FileExcelOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

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

  // 获取合作伙伴列表
  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners');
      if (response.ok) {
        const result = await response.json();
        // API返回格式为 {data: [...]}
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
        // API返回格式为 {data: [...]}
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
      } else {
        // 默认使用财务报表
        apiUrl = '/api/reports/finance';
        params.append('start_date', dateRange[0].format('YYYY-MM-DD'));
        params.append('end_date', dateRange[1].format('YYYY-MM-DD'));
        params.append('group_by', 'month');
      }

      const url = params.toString() ? `${apiUrl}?${params}` : apiUrl;
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        // API返回格式为 {data: [...]}
        let data = Array.isArray(result.data) ? result.data : [];
        
        // 如果是进出货报表，需要根据类型过滤数据
        if (reportType === 'inbound') {
          data = data.filter(item => item.inbound_date); // 有入库日期的是入库记录
        } else if (reportType === 'outbound') {
          data = data.filter(item => item.outbound_date); // 有出库日期的是出库记录
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
        exportToCSV();
      } else if (format === 'excel') {
        exportToExcel();
      }
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  // 导出为CSV
  const exportToCSV = () => {
    const columns = getColumns();
    const headers = columns.map(col => col.title).join(',');
    const rows = reportData.map(row => 
      columns.map(col => {
        const value = row[col.dataIndex];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value || '';
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getReportTitle()}_${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    message.success('CSV导出成功');
  };

  // 导出为Excel (简化版本，使用CSV格式但.xlsx扩展名)
  const exportToExcel = () => {
    const columns = getColumns();
    const headers = columns.map(col => col.title).join('\t');
    const rows = reportData.map(row => 
      columns.map(col => row[col.dataIndex] || '').join('\t')
    );
    
    const excelContent = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getReportTitle()}_${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    message.success('Excel导出成功');
  };

  // 获取报表标题
  const getReportTitle = () => {
    switch (reportType) {
      case 'inbound':
        return '入库报表';
      case 'outbound':
        return '出库报表';
      case 'stock':
        return '库存报表';
      default:
        return '报表';
    }
  };

  // 获取表格列定义
  const getColumns = () => {
    switch (reportType) {
      case 'inbound':
        return [
          { title: '入库日期', dataIndex: 'inbound_date', key: 'inbound_date', width: 120 },
          { title: '供应商', dataIndex: 'supplier_short_name', key: 'supplier_short_name', width: 120 },
          { title: '产品型号', dataIndex: 'product_model', key: 'product_model', width: 150 },
          { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
          { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 100, render: (price) => `¥${price}` },
          { title: '总价', dataIndex: 'total_price', key: 'total_price', width: 100, render: (price) => `¥${price}` },
          { title: '付款金额', dataIndex: 'payment_amount', key: 'payment_amount', width: 100, render: (amount) => `¥${amount || 0}` },
          { title: '应付金额', dataIndex: 'payable_amount', key: 'payable_amount', width: 100, render: (amount) => `¥${amount || 0}` },
        ];
      case 'outbound':
        return [
          { title: '出库日期', dataIndex: 'outbound_date', key: 'outbound_date', width: 120 },
          { title: '客户', dataIndex: 'customer_short_name', key: 'customer_short_name', width: 120 },
          { title: '产品型号', dataIndex: 'product_model', key: 'product_model', width: 150 },
          { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
          { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 100, render: (price) => `¥${price}` },
          { title: '总价', dataIndex: 'total_price', key: 'total_price', width: 100, render: (price) => `¥${price}` },
          { title: '回款金额', dataIndex: 'collection_amount', key: 'collection_amount', width: 100, render: (amount) => `¥${amount || 0}` },
          { title: '应收金额', dataIndex: 'receivable_amount', key: 'receivable_amount', width: 100, render: (amount) => `¥${amount || 0}` },
        ];
      case 'stock':
        return [
          { title: '产品型号', dataIndex: 'product_model', key: 'product_model', width: 200 },
          { title: '当前库存', dataIndex: 'stock_quantity', key: 'stock_quantity', width: 120 },
          { title: '最后更新时间', dataIndex: 'update_time', key: 'update_time', width: 180 },
        ];
      default:
        return [];
    }
  };

  return (
    <div>
      {/* 报表筛选条件 */}
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>报表导出</Title>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Text strong>报表类型：</Text>
            <Select
              value={reportType}
              onChange={setReportType}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="inbound">入库报表</Option>
              <Option value="outbound">出库报表</Option>
              <Option value="stock">库存报表</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Text strong>日期范围：</Text>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%', marginTop: 8 }}
              format="YYYY-MM-DD"
            />
          </Col>
          <Col span={6}>
            <Text strong>合作伙伴：</Text>
            <Select
              value={selectedPartner}
              onChange={setSelectedPartner}
              style={{ width: '100%', marginTop: 8 }}
              placeholder="全部"
              allowClear
              showSearch
            >
              {partners.map(partner => (
                <Option key={partner.short_name} value={partner.short_name}>
                  {partner.short_name} - {partner.full_name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Text strong>产品：</Text>
            <Select
              value={selectedProduct}
              onChange={setSelectedProduct}
              style={{ width: '100%', marginTop: 8 }}
              placeholder="全部"
              allowClear
              showSearch
            >
              {products.map(product => (
                <Option key={product.product_model} value={product.product_model}>
                  {product.product_model}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={generateReport}
                loading={loading}
              >
                生成报表
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => exportReport('xlsx')}
                disabled={!reportData}
              >
                导出Excel
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => exportReport('csv')}
                disabled={!reportData}
              >
                导出CSV
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 报表数据展示 */}
      {loading && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>正在生成报表...</Text>
            </div>
          </div>
        </Card>
      )}

      {reportData && !loading && (
        <Card style={{ marginTop: 16 }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                {getReportTitle()} - {dateRange[0].format('YYYY-MM-DD')} 至 {dateRange[1].format('YYYY-MM-DD')}
              </Title>
            </Col>
            <Col>
              <Text type="secondary">
                共 {reportData.data?.length || 0} 条记录
              </Text>
            </Col>
          </Row>

          <Divider />

          {/* 统计信息 */}
          {reportData.summary && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              {Object.entries(reportData.summary).map(([key, value]) => (
                <Col span={6} key={key}>
                  <Card size="small">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                        {typeof value === 'number' && key.includes('amount') ? `¥${value}` : value}
                      </div>
                      <div style={{ color: '#666' }}>
                        {key === 'total_records' && '总记录数'}
                        {key === 'total_amount' && '总金额'}
                        {key === 'total_quantity' && '总数量'}
                        {key === 'total_products' && '产品种类'}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* 数据表格 */}
          <div className="responsive-table">
            <Table
              columns={getColumns()}
              dataSource={reportData.data || []}
              rowKey={(record, index) => index}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              }}
              scroll={{ x: 1000 }}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default Report;
