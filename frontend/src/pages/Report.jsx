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
  Spin,
  Form,
  Input,
  Tabs
} from 'antd';
import { DownloadOutlined, FileExcelOutlined, SearchOutlined, DatabaseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
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
      case 'finance':
        return '财务报表';
      default:
        return '报表';
    }
  };

  // 获取表格列定义
  const getColumns = () => {
    switch (reportType) {
      case 'inbound':
        return [
          { title: '入库单号', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id },
          { title: '供应商', dataIndex: 'partner_name', key: 'partner_name' },
          { title: '产品型号', dataIndex: 'product_model', key: 'product_model' },
          { title: '数量', dataIndex: 'quantity', key: 'quantity', sorter: (a, b) => a.quantity - b.quantity },
          { title: '单价', dataIndex: 'unit_price', key: 'unit_price', 
            render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
            sorter: (a, b) => a.unit_price - b.unit_price
          },
          { title: '总价', dataIndex: 'total_price', key: 'total_price', 
            render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
            sorter: (a, b) => a.total_price - b.total_price
          },
          { title: '日期', dataIndex: 'date', key: 'date', sorter: (a, b) => a.date.localeCompare(b.date) },
          { title: '备注', dataIndex: 'remark', key: 'remark' }
        ];
      case 'outbound':
        return [
          { title: '出库单号', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id },
          { title: '客户', dataIndex: 'partner_name', key: 'partner_name' },
          { title: '产品型号', dataIndex: 'product_model', key: 'product_model' },
          { title: '数量', dataIndex: 'quantity', key: 'quantity', sorter: (a, b) => a.quantity - b.quantity },
          { title: '单价', dataIndex: 'unit_price', key: 'unit_price', 
            render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
            sorter: (a, b) => a.unit_price - b.unit_price
          },
          { title: '总价', dataIndex: 'total_price', key: 'total_price', 
            render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
            sorter: (a, b) => a.total_price - b.total_price
          },
          { title: '日期', dataIndex: 'date', key: 'date', sorter: (a, b) => a.date.localeCompare(b.date) },
          { title: '备注', dataIndex: 'remark', key: 'remark' }
        ];
      case 'stock':
        return [
          { title: '产品分类', dataIndex: 'category', key: 'category' },
          { title: '产品型号', dataIndex: 'product_model', key: 'product_model' },
          { title: '总入库', dataIndex: 'total_inbound', key: 'total_inbound', 
            sorter: (a, b) => a.total_inbound - b.total_inbound
          },
          { title: '总出库', dataIndex: 'total_outbound', key: 'total_outbound', 
            sorter: (a, b) => a.total_outbound - b.total_outbound
          },
          { title: '当前库存', dataIndex: 'current_stock', key: 'current_stock', 
            sorter: (a, b) => a.current_stock - b.current_stock,
            render: (text) => {
              const stock = Number(text) || 0;
              return (
                <span style={{ color: stock < 0 ? '#ff4d4f' : stock === 0 ? '#faad14' : '#52c41a' }}>
                  {stock}
                </span>
              );
            }
          },
          { title: '最后更新', dataIndex: 'last_update', key: 'last_update', 
            sorter: (a, b) => (a.last_update || '').localeCompare(b.last_update || '')
          }
        ];
      case 'finance':
        return [
          { title: '时间段', dataIndex: 'period', key: 'period', sorter: (a, b) => a.period.localeCompare(b.period) },
          { title: '总采购', dataIndex: 'total_purchase', key: 'total_purchase', 
            render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
            sorter: (a, b) => a.total_purchase - b.total_purchase
          },
          { title: '总销售', dataIndex: 'total_sales', key: 'total_sales', 
            render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
            sorter: (a, b) => a.total_sales - b.total_sales
          },
          { title: '利润', dataIndex: 'profit', key: 'profit', 
            render: (text) => {
              const profit = Number(text) || 0;
              return (
                <span style={{ color: profit < 0 ? '#ff4d4f' : '#52c41a' }}>
                  ¥{profit.toFixed(2)}
                </span>
              );
            },
            sorter: (a, b) => a.profit - b.profit
          },
          { title: '已付款', dataIndex: 'total_payment', key: 'total_payment', 
            render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
            sorter: (a, b) => a.total_payment - b.total_payment
          },
          { title: '已收款', dataIndex: 'total_collection', key: 'total_collection', 
            render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
            sorter: (a, b) => a.total_collection - b.total_collection
          },
          { title: '净现金流', dataIndex: 'net_cash_flow', key: 'net_cash_flow', 
            render: (text) => {
              const flow = Number(text) || 0;
              return (
                <span style={{ color: flow < 0 ? '#ff4d4f' : '#52c41a' }}>
                  ¥{flow.toFixed(2)}
                </span>
              );
            },
            sorter: (a, b) => a.net_cash_flow - b.net_cash_flow
          },
          { title: '应付款', dataIndex: 'total_payable', key: 'total_payable', 
            render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
            sorter: (a, b) => a.total_payable - b.total_payable
          },
          { title: '应收款', dataIndex: 'total_receivable', key: 'total_receivable', 
            render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
            sorter: (a, b) => a.total_receivable - b.total_receivable
          }
        ];
      default:
        return [];
    }
  };

  // 导出组件
  const ExportPanel = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="基础信息导出" size="small">
            <Space wrap>
              <Button
                type="primary"
                icon={<DatabaseOutlined />}
                onClick={() => handlePythonExport('base-info', { tables: '123' })}
                loading={loading}
              >
                导出全部基础信息
              </Button>
              <Button
                icon={<DatabaseOutlined />}
                onClick={() => handlePythonExport('base-info', { tables: '1' })}
                loading={loading}
              >
                仅导出客户/供应商
              </Button>
              <Button
                icon={<DatabaseOutlined />}
                onClick={() => handlePythonExport('base-info', { tables: '2' })}
                loading={loading}
              >
                仅导出产品
              </Button>
              <Button
                icon={<DatabaseOutlined />}
                onClick={() => handlePythonExport('base-info', { tables: '3' })}
                loading={loading}
              >
                仅导出产品价格
              </Button>
            </Space>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="入库出库记录导出" size="small">
            <Form layout="inline" style={{ marginBottom: 16 }}>
              <Form.Item label="日期范围">
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
              <Form.Item label="产品代号">
                <Input
                  placeholder="可选"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  style={{ width: 120 }}
                />
              </Form.Item>
            </Form>
            <Space wrap>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={() => handlePythonExport('inbound-outbound', {
                  tables: '12',
                  dateFrom: dateRange[0].format('YYYY-MM-DD'),
                  dateTo: dateRange[1].format('YYYY-MM-DD'),
                  productCode: selectedProduct || undefined
                })}
                loading={loading}
              >
                导出入库出库记录
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => handlePythonExport('inbound-outbound', {
                  tables: '1',
                  dateFrom: dateRange[0].format('YYYY-MM-DD'),
                  dateTo: dateRange[1].format('YYYY-MM-DD'),
                  productCode: selectedProduct || undefined
                })}
                loading={loading}
              >
                仅导出入库记录
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => handlePythonExport('inbound-outbound', {
                  tables: '2',
                  dateFrom: dateRange[0].format('YYYY-MM-DD'),
                  dateTo: dateRange[1].format('YYYY-MM-DD'),
                  productCode: selectedProduct || undefined
                })}
                loading={loading}
              >
                仅导出出库记录
              </Button>
            </Space>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="应收应付明细导出" size="small">
            <Form layout="inline" style={{ marginBottom: 16 }}>
              <Form.Item label="出入库日期">
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
              <Form.Item label="回付款日期">
                <RangePicker
                  format="YYYY-MM-DD"
                  placeholder={['回付款开始日期', '回付款结束日期']}
                />
              </Form.Item>
            </Form>
            <Space wrap>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={() => handlePythonExport('receivable-payable', {
                  outboundFrom: dateRange[0].format('YYYY-MM-DD'),
                  outboundTo: dateRange[1].format('YYYY-MM-DD'),
                  paymentFrom: dateRange[0].format('YYYY-MM-DD'),
                  paymentTo: dateRange[1].format('YYYY-MM-DD')
                })}
                loading={loading}
              >
                导出应收应付明细
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );

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
                  <Option value="finance">财务报表</Option>
                </Select>
              </Col>
              <Col span={6}>
                <Text strong>日期范围：</Text>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  style={{ width: '100%', marginTop: 8 }}
                  format="YYYY-MM-DD"
                  disabled={reportType === 'stock'}
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
                    onClick={() => exportReport('excel')}
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
                      共 {reportData.length || 0} 条记录
                    </Text>
                  </Col>
                </Row>

                <Divider />

                <div className="responsive-table">
                  <Table
                    columns={getColumns()}
                    dataSource={reportData}
                    rowKey={(record, index) => index}
                    pagination={{
                      pageSize: 10,
                      showQuickJumper: true,
                      showTotal: (total, range) =>
                        `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                    }}
                    scroll={{ x: 1000 }}
                    summary={(pageData) => {
                      if (reportType === 'inbound' || reportType === 'outbound') {
                        const totalQuantity = pageData.reduce((sum, record) => sum + (record.quantity || 0), 0);
                        const totalPrice = pageData.reduce((sum, record) => sum + (record.total_price || 0), 0);
                        return (
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={3}>
                              <strong>当前页小计</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                              <strong>{totalQuantity}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2} />
                            <Table.Summary.Cell index={3}>
                              <strong>¥{totalPrice.toFixed(2)}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4} colSpan={2} />
                          </Table.Summary.Row>
                        );
                      }
                      return null;
                    }}
                  />
                </div>
              </Card>
            )}
          </TabPane>
          
          <TabPane tab="高级导出" key="export">
            <ExportPanel />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Report;
