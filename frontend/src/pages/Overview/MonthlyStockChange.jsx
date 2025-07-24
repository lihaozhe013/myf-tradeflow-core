import { useState, useEffect } from 'react';
import { 
  Card, Select, Statistic, Row, Col, Spin, Alert, Typography 
} from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  InboxOutlined,
  StockOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

/**
 * 本月库存变化量组件
 * 用户可以选择产品，查看该产品本月的库存变化信息
 */
const MonthlyStockChange = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);

  // 获取产品列表
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
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
        setError('获取产品列表失败：数据格式错误');
      }
    } catch (err) {
      console.error('获取产品列表失败:', err);
      setError('获取产品列表失败');
    }
  };

  // 获取选中产品的本月库存变化数据
  useEffect(() => {
    if (selectedProduct) {
      fetchMonthlyStockChange(selectedProduct);
    }
  }, [selectedProduct]);

  const fetchMonthlyStockChange = async (productModel) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/overview/monthly-stock-change/${encodeURIComponent(productModel)}`);
      const result = await response.json();
      
      if (result.success) {
        setStockData(result.data);
      } else {
        setError(result.message || '获取库存变化数据失败');
      }
    } catch (err) {
      console.error('获取库存变化数据失败:', err);
      setError('获取库存变化数据失败');
    } finally {
      setLoading(false);
    }
  };

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
      title="本月库存变化量"
      variant="outlined"
      style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', height: '100%' }}
      extra={
        <Select
          value={selectedProduct}
          onChange={handleProductChange}
          style={{ width: 200 }}
          placeholder="选择产品"
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
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary">正在加载库存数据...</Text>
          </div>
        </div>
      ) : error ? (
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
          style={{ margin: '20px 0' }}
        />
      ) : stockData ? (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Statistic
              title="月初库存"
              value={stockData.month_start_stock || 0}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Col>
          <Col span={24}>
            <Statistic
              title="当前库存"
              value={stockData.current_stock || 0}
              prefix={<StockOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col span={24}>
            <Statistic
              title="本月变化量"
              value={Math.abs(stockData.monthly_change || 0)}
              prefix={getTrendIcon(stockData.monthly_change)}
              suffix={stockData.monthly_change > 0 ? '(增加)' : stockData.monthly_change < 0 ? '(减少)' : '(无变化)'}
              valueStyle={{ color: getTrendColor(stockData.monthly_change) }}
            />
          </Col>
        </Row>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">请选择产品查看库存变化</Text>
        </div>
      )}
    </Card>
  );
};

export default MonthlyStockChange;
