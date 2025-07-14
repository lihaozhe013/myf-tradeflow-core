import { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Spin, Alert, Typography, Button, Space, Statistic
} from 'antd';
import { 
  ShoppingCartOutlined,
  RiseOutlined,
  DollarOutlined,
  SyncOutlined,
  ImportOutlined,
  ExportOutlined
} from '@ant-design/icons';

import StockStatusData from './StockStatusData';
import QuickStats from './QuickStats';
import StockTrendChart from './StockTrendChart';

const { Title, Text } = Typography;

const OverviewMain = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/overview/stats');
      const result = await response.json();
      setStats(result);
      setError(null);
    } catch (err) {
      console.error('❌ 获取数据失败:', err);
      setError('获取数据失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理数据格式
  const overview = stats.overview?.[0] || {};
  const stockAnalysis = stats.stock_analysis || [];
  const popularProducts = stats.popular_products || [];
  const topCustomers = stats.top_customers || [];
  const topSuppliers = stats.top_suppliers || [];
  const stockTrend = stats.stock_trend || [];

  // 处理库存趋势数据用于图表
  const getStockTrendData = () => {
    
    const dailyTotals = {};
    // 按日期汇总所有产品的库存量，确保cumulative_stock为数字且不为null
    stockTrend.forEach((item, index) => {
      
      const date = item.date.split(' ')[0]; // 只取日期部分
      const stockValue = Number(item.cumulative_stock);
      
      
      if (isNaN(stockValue) || stockValue == null) {
      }
      if (!dailyTotals[date]) {
        dailyTotals[date] = 0;
      }
      dailyTotals[date] += isNaN(stockValue) ? 0 : stockValue;
      
    });
    
    
    const result = Object.entries(dailyTotals)
      .map(([date, total]) => ({
        date,
        value: Number((total / 1000).toFixed(2)), // 转换为千为单位
        category: '总库存'
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    
    return result;
  };

  // 快速操作函数
  const handleQuickInbound = () => {
    window.location.href = '/inbound';
  };

  const handleQuickOutbound = () => {
    window.location.href = '/outbound';
  };


  // 计算利润率
  const calculateProfitMargin = () => {
    const purchase = overview.total_purchase_amount || 0;
    const sales = overview.total_sales_amount || 0;
    if (purchase === 0) return 0;
    return ((sales - purchase) / purchase * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e9f5ff 100%)'
      }}>
        <Card style={{ textAlign: 'center', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px', color: '#666' }}>正在加载系统数据...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e9f5ff 100%)'
      }}>
        <Alert
          message="系统数据加载失败"
          description={error}
          type="error"
          showIcon  
          style={{ 
            borderRadius: '16px', 
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            maxWidth: '500px'
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e9f5ff 100%)',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 4px 32px rgba(0,0,0,0.04)',
      transition: 'border-radius 0.3s',
    }}>
      {/* 页面标题区域 */}
      <div style={{ 
        marginBottom: '32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0 8px'
      }}>
        <div>
          <Title level={1} style={{ color: '#222', margin: 0, fontSize: '36px', fontWeight: 'bold', letterSpacing: 2 }}>
            🚀 系统总览
          </Title>
          <Text style={{ color: '#888', fontSize: '16px' }}>
            小型公司进出货 + 账务系统数据中心
          </Text>
        </div>
        <Space>
          <Button 
            type="primary" 
            icon={<ImportOutlined />}
            onClick={handleQuickInbound}
            size="large"
            style={{
              borderRadius: '12px',
              background: '#52c41a',
              border: 'none',
              color: 'white',
              boxShadow: '0 2px 8px rgba(82,196,26,0.2)',
              marginRight: '8px'
            }}
          >
            快速入库
          </Button>
          <Button 
            type="primary" 
            icon={<ExportOutlined />}
            onClick={handleQuickOutbound}
            size="large"
            style={{
              borderRadius: '12px',
              background: '#fa8c16',
              border: 'none',
              color: 'white',
              boxShadow: '0 2px 8px rgba(250,140,22,0.2)',
              marginRight: '8px'
            }}
          >
            快速出库
          </Button>
          <Button 
            type="primary" 
            icon={<SyncOutlined />}
            onClick={fetchStats} 
            loading={loading}
            size="large"
            style={{
              borderRadius: '12px',
              background: '#1677ff',
              border: 'none',
              color: 'white',
              boxShadow: '0 2px 8px rgba(22,119,255,0.08)'
            }}
          >
            刷新数据
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col span={24}>
          <Card
            title="概览"
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="总销售额"
                  value={overview.total_sales_amount}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="总采购额"
                  value={overview.total_purchase_amount}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="利润率"
                  value={calculateProfitMargin()}
                  suffix="%"
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={24} style={{ marginTop: '24px' }}>
        <Col span={16}>
          <Card
            title="库存状态"
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', height: '100%' }}
            bodyStyle={{ height: 'calc(100% - 56px)', display: 'flex', alignItems: 'center' }}
          >
            <StockStatusData stockAnalysis={stockAnalysis} />
          </Card>
        </Col>
        <Col span={8}>
          <QuickStats overview={overview} />
        </Col>
      </Row>

      <Row gutter={24} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <StockTrendChart stockTrend={stockTrend} />
        </Col>
      </Row>
    </div>
  );
};

export default OverviewMain;
