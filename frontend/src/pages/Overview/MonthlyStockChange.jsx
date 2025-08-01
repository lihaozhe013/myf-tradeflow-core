import { useState, useEffect, useCallback } from 'react';
import { 
  Card, Select, Statistic, Row, Col, Spin, Alert, Typography 
} from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  InboxOutlined,
  StockOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;
const { Option } = Select;

/**
 * 本月库存变化量组件
 * 用户可以选择产品，查看该产品本月的库存变化信息
 */
const MonthlyStockChange = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        setProducts(result.data);
        // 默认选择第一个产品
        if (result.data.length > 0) {
          setSelectedProduct(result.data[0].product_model);
        }
      } else {
        console.error('API返回数据格式不正确:', result);
        setError(t('overview.dataFormatError'));
      }
    } catch (err) {
      console.error(t('overview.productListFailed'), err);
      setError(t('overview.productListFailed'));
    }
  }, [t]);

  // 获取产品列表
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchMonthlyStockChange = useCallback(async (productModel) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/overview/monthly-stock-change/${encodeURIComponent(productModel)}`);
      const result = await response.json();
      
      if (result.success) {
        setStockData(result.data);
      } else {
        setError(result.message || result.error || t('overview.stockChangeFailed'));
      }
    } catch (err) {
      console.error(t('overview.stockChangeFailed'), err);
      setError(t('overview.stockChangeFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 获取选中产品的本月库存变化数据
  useEffect(() => {
    if (selectedProduct) {
      fetchMonthlyStockChange(selectedProduct);
    }
  }, [selectedProduct, fetchMonthlyStockChange]);

  const handleProductChange = (value) => {
    setSelectedProduct(value);
  };

  // 计算变化趋势图标和颜色
  const getTrendIcon = (change) => {
    if (change > 0) {
      return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
    } else if (change < 0) {
      return <ArrowDownOutlined style={{ color: '#ff4d4f' }} />;
    }
    return <StockOutlined style={{ color: '#666' }} />;
  };

  const getTrendColor = (change) => {
    if (change > 0) return '#52c41a';
    if (change < 0) return '#ff4d4f';
    return '#666';
  };

  return (
    <Card
      title={t('overview.monthlyStockChange')}
      variant="outlined"
      style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', height: 370 }}
      extra={
        <Select
          value={selectedProduct}
          onChange={handleProductChange}
          style={{ width: 200 }}
          placeholder={t('overview.selectProduct')}
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {products.map(product => (
            <Option key={product.product_model} value={product.product_model}>
              {product.product_model}
            </Option>
          ))}
        </Select>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary">{t('overview.loadingStock')}</Text>
          </div>
        </div>
      ) : error ? (
        <Alert
          message={t('overview.dataLoadFailed')}
          description={error}
          type="error"
          showIcon
          style={{ margin: '10px 0' }}
        />
      ) : stockData ? (
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Statistic
              title={t('overview.monthStartStock')}
              value={stockData.month_start_stock || 0}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#1677ff', fontSize: '16px' }}
            />
          </Col>
          <Col span={24}>
            <Statistic
              title={t('overview.currentStock')}
              value={stockData.current_stock || 0}
              prefix={<StockOutlined />}
              valueStyle={{ color: '#722ed1', fontSize: '16px' }}
            />
          </Col>
          <Col span={24}>
            <Statistic
              title={t('overview.monthlyChange')}
              value={Math.abs(stockData.monthly_change || 0)}
              prefix={getTrendIcon(stockData.monthly_change)}
              suffix={stockData.monthly_change > 0 ? t('overview.increase') : stockData.monthly_change < 0 ? t('overview.decrease') : t('overview.noChange')}
              valueStyle={{ color: getTrendColor(stockData.monthly_change), fontSize: '16px' }}
            />
          </Col>
        </Row>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Text type="secondary">{t('overview.selectProductToView')}</Text>
        </div>
      )}
    </Card>
  );
};

export default MonthlyStockChange;
