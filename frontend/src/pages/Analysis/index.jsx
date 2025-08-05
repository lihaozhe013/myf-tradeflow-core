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
  Alert,
  Table
} from 'antd';
import { 
  ReloadOutlined, 
  DollarOutlined, 
  ShoppingCartOutlined, 
  RiseOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Analysis = () => {
  const { t } = useTranslation();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [detailData, setDetailData] = useState([]);
  
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
        message.error(t('analysis.getFilterOptionsFailed'));
      }
    } catch (error) {
      console.error('获取筛选选项失败:', error);
      message.error(t('analysis.getFilterOptionsFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 获取分析数据
  const fetchAnalysisData = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning(t('analysis.selectTimeRange'));
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

      // 获取基本分析数据
      const response = await fetch(`/api/analysis/data?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setAnalysisData(result.data);
      } else {
        // 数据未生成，需要刷新
        setAnalysisData(null);
        if (response.status === 503) {
          message.info(t('analysis.dataNotGenerated'));
        } else {
          message.error(result.message || t('analysis.getAnalysisDataFailed'));
        }
      }

      // 获取详细分析数据
      const detailResponse = await fetch(`/api/analysis/detail?${params}`);
      const detailResult = await detailResponse.json();
      
      if (detailResult.success) {
        setDetailData(detailResult.data.detail_data || []);
      } else {
        setDetailData([]);
      }
    } catch (error) {
      console.error('获取分析数据失败:', error);
      message.error(t('analysis.getAnalysisDataFailed'));
      setAnalysisData(null);
      setDetailData([]);
    } finally {
      setLoading(false);
    }
  };

  // 刷新分析数据
  const refreshAnalysisData = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning(t('analysis.selectTimeRange'));
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
        message.success(t('analysis.refreshSuccess'));
        
        // 刷新成功后也要获取详细数据
        fetchAnalysisData();
      } else {
        message.error(result.message || t('analysis.refreshFailed'));
      }
    } catch (error) {
      console.error('刷新数据失败:', error);
      message.error(t('analysis.refreshFailed'));
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
    if (selectedCustomer === 'ALL') return t('analysis.allCustomers');
    const customer = customers.find(c => c.code === selectedCustomer);
    return customer ? customer.name : selectedCustomer;
  };

  // 获取产品显示名称
  const getProductDisplayName = () => {
    if (selectedProduct === 'ALL') return t('analysis.allProducts');
    return selectedProduct;
  };

  // 判断是否需要显示详细表格
  const shouldShowDetailTable = () => {
    const hasSpecificCustomer = selectedCustomer && selectedCustomer !== 'ALL';
    const hasSpecificProduct = selectedProduct && selectedProduct !== 'ALL';
    
    // 只有当指定了客户但产品为All，或指定了产品但客户为All时才显示详细表格
    return (hasSpecificCustomer && !hasSpecificProduct) || (!hasSpecificCustomer && hasSpecificProduct);
  };

  // 获取详细表格标题
  const getDetailTableTitle = () => {
    const hasSpecificCustomer = selectedCustomer && selectedCustomer !== 'ALL';
    const hasSpecificProduct = selectedProduct && selectedProduct !== 'ALL';
    
    if (hasSpecificCustomer && !hasSpecificProduct) {
      const customerName = getCustomerDisplayName();
      return t('analysis.customerProductDetail', { customer: customerName });
    } else if (!hasSpecificCustomer && hasSpecificProduct) {
      const productName = getProductDisplayName();
      return t('analysis.productCustomerDetail', { product: productName });
    }
    return '';
  };

  // 详细表格列配置
  const getDetailTableColumns = () => {
    const hasSpecificCustomer = selectedCustomer && selectedCustomer !== 'ALL';
    const hasSpecificProduct = selectedProduct && selectedProduct !== 'ALL';
    
    const baseColumns = [
      {
        title: t('analysis.salesAmount'),
        dataIndex: 'sales_amount',
        key: 'sales_amount',
        render: (value) => formatCurrency(value),
        align: 'right',
        sorter: (a, b) => a.sales_amount - b.sales_amount,
      },
      {
        title: t('analysis.cost'),
        dataIndex: 'cost_amount',
        key: 'cost_amount',
        render: (value) => formatCurrency(value),
        align: 'right',
        sorter: (a, b) => a.cost_amount - b.cost_amount,
      },
      {
        title: t('analysis.profit'),
        dataIndex: 'profit_amount',
        key: 'profit_amount',
        render: (value) => (
          <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {formatCurrency(value)}
          </span>
        ),
        align: 'right',
        sorter: (a, b) => a.profit_amount - b.profit_amount,
      },
      {
        title: t('analysis.profitRate'),
        dataIndex: 'profit_rate',
        key: 'profit_rate',
        render: (value) => (
          <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {formatPercentage(value)}
          </span>
        ),
        align: 'right',
        sorter: (a, b) => a.profit_rate - b.profit_rate,
      },
    ];

    if (hasSpecificCustomer && !hasSpecificProduct) {
      // 显示产品列
      return [
        {
          title: t('analysis.product'),
          dataIndex: 'product_model',
          key: 'product_model',
          fixed: 'left',
          width: 150,
        },
        ...baseColumns
      ];
    } else if (!hasSpecificCustomer && hasSpecificProduct) {
      // 显示客户列
      return [
        {
          title: t('analysis.customer'),
          dataIndex: 'customer_code',
          key: 'customer_code',
          fixed: 'left',
          width: 150,
          render: (value) => {
            const customer = customers.find(c => c.code === value);
            return customer ? customer.name : value;
          },
        },
        ...baseColumns
      ];
    }
    
    return baseColumns;
  };

  return (
    <div style={{ padding: '0 24px' }}>
      <Card title={t('analysis.title')} style={{ marginBottom: 24 }}>
        
        {/* 筛选条件区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: 8 }}>
              <strong>{t('analysis.timeRange')}</strong>
            </div>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder={[t('analysis.startDate'), t('analysis.endDate')]}
            />
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: 8 }}>
              <strong>{t('analysis.customer')}</strong>
            </div>
            <Select
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              style={{ width: '100%' }}
              placeholder={t('analysis.selectCustomer')}
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
              <strong>{t('analysis.product')}</strong>
            </div>
            <Select
              value={selectedProduct}
              onChange={setSelectedProduct}
              style={{ width: '100%' }}
              placeholder={t('analysis.selectProduct')}
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
              {t('analysis.refreshData')}
            </Button>
          </Col>
        </Row>

        <Divider />

        {/* 分析条件显示 */}
        {dateRange && dateRange[0] && dateRange[1] && (
          <Alert
            message={
              <Space>
                <span><strong>{t('analysis.analysisConditions')}:</strong></span>
                <span>{t('analysis.time')}: {dateRange[0].format('YYYY-MM-DD')} {t('analysis.to')} {dateRange[1].format('YYYY-MM-DD')}</span>
                <span>{t('analysis.customer')}: {getCustomerDisplayName()}</span>
                <span>{t('analysis.product')}: {getProductDisplayName()}</span>
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
                    title={t('analysis.salesAmount')}
                    value={formatCurrency(analysisData.sales_amount)}
                    prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title={t('analysis.cost')}
                    value={formatCurrency(analysisData.cost_amount)}
                    prefix={<ShoppingCartOutlined style={{ color: '#faad14' }} />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title={t('analysis.profit')}
                    value={formatCurrency(analysisData.profit_amount)}
                    prefix={<RiseOutlined style={{ color: analysisData.profit_amount >= 0 ? '#52c41a' : '#ff4d4f' }} />}
                    valueStyle={{ color: analysisData.profit_amount >= 0 ? '#52c41a' : '#ff4d4f' }}
                  />
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title={t('analysis.profitRate')}
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
                message={t('analysis.noAnalysisData')}
                description={t('analysis.noAnalysisDataDesc')}
                type="info"
                showIcon
              />
            </div>
          )}
        </Spin>

        {/* 数据更新时间 */}
        {analysisData && analysisData.last_updated && (
          <div style={{ textAlign: 'center', marginTop: 24, color: '#666' }}>
            <small>{t('analysis.dataUpdateTime')}: {dayjs(analysisData.last_updated).format('YYYY-MM-DD HH:mm:ss')}</small>
          </div>
        )}

        {/* 详细分析表格 */}
        {shouldShowDetailTable() && detailData.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <Card title={getDetailTableTitle()}>
              <Table
                columns={getDetailTableColumns()}
                dataSource={detailData}
                rowKey={(record) => `${record.customer_code}_${record.product_model}`}
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => t('analysis.totalRecords', { total }),
                }}
                scroll={{ x: 800 }}
                size="middle"
              />
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Analysis;
