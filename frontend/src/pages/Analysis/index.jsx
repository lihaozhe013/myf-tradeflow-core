import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Select, 
  DatePicker, 
  Button, 
  Row, 
  Col, 
  Statistic, 
  message, 
  Spin,
  Space,
  Divider,
  Alert
} from 'antd';
import { 
  ReloadOutlined, 
  DollarOutlined, 
  ShoppingCartOutlined, 
  RiseOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Analysis = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  
  // 筛选条件
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(1, 'month'),
    dayjs()
  ]);
  const [selectedCustomer, setSelectedCustomer] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState('ALL');

  // 组件挂载时获取筛选选项
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // 获取筛选选项
  const fetchFilterOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analysis/filter-options');
      const result = await response.json();
      
      if (result.success) {
        setCustomers(result.customers);
        setProducts(result.products);
      } else {
        message.error('获取筛选选项失败');
      }
    } catch (error) {
      console.error('获取筛选选项失败:', error);
      message.error('获取筛选选项失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取分析数据
  const fetchAnalysisData = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning('请选择时间区间');
      return;
    }

    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      });
      
      if (selectedCustomer && selectedCustomer !== 'ALL') {
        params.append('customer_code', selectedCustomer);
      }
      
      if (selectedProduct && selectedProduct !== 'ALL') {
        params.append('product_model', selectedProduct);
      }

      const response = await fetch(`/api/analysis/data?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setAnalysisData(result.data);
      } else {
        // 数据未生成，需要刷新
        setAnalysisData(null);
        if (response.status === 503) {
          message.info('数据未生成，请点击刷新按钮计算数据');
        } else {
          message.error(result.message || '获取分析数据失败');
        }
      }
    } catch (error) {
      console.error('获取分析数据失败:', error);
      message.error('获取分析数据失败');
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  // 刷新分析数据
  const refreshAnalysisData = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning('请选择时间区间');
      return;
    }

    try {
      setRefreshing(true);
      
      const requestBody = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      };
      
      if (selectedCustomer && selectedCustomer !== 'ALL') {
        requestBody.customer_code = selectedCustomer;
      }
      
      if (selectedProduct && selectedProduct !== 'ALL') {
        requestBody.product_model = selectedProduct;
      }

      const response = await fetch('/api/analysis/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysisData(result.data);
        message.success('数据刷新成功');
      } else {
        message.error(result.message || '刷新数据失败');
      }
    } catch (error) {
      console.error('刷新数据失败:', error);
      message.error('刷新数据失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 筛选条件变化时自动获取数据
  useEffect(() => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      fetchAnalysisData();
    }
  }, [dateRange, selectedCustomer, selectedProduct]);

  // 格式化金额
  const formatCurrency = (amount) => {
    return `¥${Number(amount || 0).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // 格式化百分比
  const formatPercentage = (rate) => {
    return `${Number(rate || 0).toFixed(2)}%`;
  };

  // 获取客户显示名称
  const getCustomerDisplayName = () => {
    if (selectedCustomer === 'ALL') return '全部客户';
    const customer = customers.find(c => c.code === selectedCustomer);
    return customer ? customer.name : selectedCustomer;
  };

  // 获取产品显示名称
  const getProductDisplayName = () => {
    if (selectedProduct === 'ALL') return '全部产品';
    return selectedProduct;
  };

  return (
    <div style={{ padding: '0 24px' }}>
      <Card title="数据分析" style={{ marginBottom: 24 }}>
        
        {/* 筛选条件区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: 8 }}>
              <strong>时间区间</strong>
            </div>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: 8 }}>
              <strong>客户</strong>
            </div>
            <Select
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              style={{ width: '100%' }}
              placeholder="请选择客户"
              loading={loading}
            >
              {customers.map(customer => (
                <Option key={customer.code} value={customer.code}>
                  {customer.name}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: 8 }}>
              <strong>产品</strong>
            </div>
            <Select
              value={selectedProduct}
              onChange={setSelectedProduct}
              style={{ width: '100%' }}
              placeholder="请选择产品"
              loading={loading}
            >
              {products.map(product => (
                <Option key={product.model} value={product.model}>
                  {product.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* 操作按钮 */}
        <Row style={{ marginBottom: 24 }}>
          <Col>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={refreshAnalysisData}
              loading={refreshing}
            >
              刷新数据
            </Button>
          </Col>
        </Row>

        <Divider />

        {/* 分析条件显示 */}
        {dateRange && dateRange[0] && dateRange[1] && (
          <Alert
            message={
              <Space>
                <span><strong>分析条件:</strong></span>
                <span>时间: {dateRange[0].format('YYYY-MM-DD')} 至 {dateRange[1].format('YYYY-MM-DD')}</span>
                <span>客户: {getCustomerDisplayName()}</span>
                <span>产品: {getProductDisplayName()}</span>
              </Space>
            }
            type="info"
            style={{ marginBottom: 24 }}
          />
        )}

        {/* 数据展示区域 */}
        <Spin spinning={loading}>
          {analysisData ? (
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="销售额"
                    value={formatCurrency(analysisData.sales_amount)}
                    prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="成本"
                    value={formatCurrency(analysisData.cost_amount)}
                    prefix={<ShoppingCartOutlined style={{ color: '#faad14' }} />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="利润"
                    value={formatCurrency(analysisData.profit_amount)}
                    prefix={<RiseOutlined style={{ color: analysisData.profit_amount >= 0 ? '#52c41a' : '#ff4d4f' }} />}
                    valueStyle={{ color: analysisData.profit_amount >= 0 ? '#52c41a' : '#ff4d4f' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="利润率"
                    value={formatPercentage(analysisData.profit_rate)}
                    prefix={<PercentageOutlined style={{ color: analysisData.profit_rate >= 0 ? '#52c41a' : '#ff4d4f' }} />}
                    valueStyle={{ color: analysisData.profit_rate >= 0 ? '#52c41a' : '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Alert
                message="暂无分析数据"
                description="请选择筛选条件并点击刷新按钮生成分析数据"
                type="info"
                showIcon
              />
            </div>
          )}
        </Spin>

        {/* 数据更新时间 */}
        {analysisData && analysisData.last_updated && (
          <div style={{ textAlign: 'center', marginTop: 24, color: '#666' }}>
            <small>数据更新时间: {dayjs(analysisData.last_updated).format('YYYY-MM-DD HH:mm:ss')}</small>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Analysis;
