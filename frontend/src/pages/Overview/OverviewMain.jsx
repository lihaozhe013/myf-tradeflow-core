import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Spin, Alert, Typography, Button, Space, Statistic, Progress, 
  List, Avatar, Tag, Divider, Timeline, Badge
} from 'antd';
import { 
  ShoppingCartOutlined, 
  TruckOutlined, 
  UserOutlined, 
  InboxOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';

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
      const response = await fetch('/api/debug/stats');
      const result = await response.json();
      setStats(result);
      setError(null);
    } catch (err) {
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

  // 计算库存状态统计
  const getStockStatusData = () => {
    const statusMap = { '缺货': 0, '库存不足': 0, '库存正常': 0, '库存充足': 0 };
    stockAnalysis.forEach(item => {
      statusMap[item.status] = item.count;
    });
    return [
      { status: '缺货', count: statusMap['缺货'], color: '#ff4d4f', icon: <CloseCircleOutlined /> },
      { status: '库存不足', count: statusMap['库存不足'], color: '#faad14', icon: <ExclamationCircleOutlined /> },
      { status: '库存正常', count: statusMap['库存正常'], color: '#52c41a', icon: <CheckCircleOutlined /> },
      { status: '库存充足', count: statusMap['库存充足'], color: '#1890ff', icon: <CheckCircleOutlined /> }
    ];
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
            style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
          >
            <Row gutter={16}>
              {getStockStatusData().map(item => (
                <Col span={6} key={item.status}>
                  <Card
                    bordered={false}
                    style={{ 
                      borderRadius: '12px', 
                      textAlign: 'center', 
                      backgroundColor: item.color, 
                      color: '#fff',
                      padding: '16px 0'
                    }}
                  >
                    <div style={{ fontSize: '24px' }}>{item.icon}</div>
                    <div style={{ marginTop: '8px', fontSize: '18px' }}>{item.status}</div>
                    <div style={{ fontSize: '16px' }}>{item.count} 件</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title="订单状态"
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
          >
            <Statistic
              title="待发货订单"
              value={overview.pending_orders}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: '#3f8600' }}
              style={{ marginBottom: '16px' }}
            />
            <Statistic
              title="已发货订单"
              value={overview.shipped_orders}
              prefix={<TruckOutlined />}
              valueStyle={{ color: '#3f8600' }}
              style={{ marginBottom: '16px' }}
            />
            <Statistic
              title="已完成订单"
              value={overview.completed_orders}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card
            title="销售趋势"
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
          >
            <LineChartOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '16px' }} />
            <Divider />
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="今日销售"
                  value={overview.today_sales}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="昨日销售"
                  value={overview.yesterday_sales}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="本月销售"
                  value={overview.monthly_sales}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={24} style={{ marginTop: '24px' }}>
        <Col span={12}>
          <Card
            title="热门产品"
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
          >
            <List
              itemLayout="horizontal"
              dataSource={popularProducts}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={item.image} />}
                    title={<a href={`/product/${item.id}`}>{item.name}</a>}
                    description={`销售量: ${item.sales_volume} 件`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title="客户统计"
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
          >
            <Statistic
              title="活跃客户"
              value={overview.active_customers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
              style={{ marginBottom: '16px' }}
            />
            <Statistic
              title="新注册客户"
              value={overview.new_customers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24} style={{ marginTop: '24px' }}>
        <Col span={12}>
          <Card
            title="供应商统计"
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
          >
            <Statistic
              title="活跃供应商"
              value={overview.active_suppliers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
              style={{ marginBottom: '16px' }}
            />
            <Statistic
              title="新注册供应商"
              value={overview.new_suppliers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title="系统健康状态"
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="API 响应时间"
                  value={overview.api_response_time}
                  suffix="ms"
                  prefix={<SyncOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="数据库连接"
                  value={overview.db_connections}
                  prefix={<SyncOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OverviewMain;
