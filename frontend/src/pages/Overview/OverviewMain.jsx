import { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Spin, Alert, Typography, Button, Space, Statistic, List, Avatar
} from 'antd';
import { 
  ShoppingCartOutlined,
  RiseOutlined,
  DollarOutlined,
  SyncOutlined,
  ImportOutlined,
  ExportOutlined
} from '@ant-design/icons';


import MonthlyStockChange from './MonthlyStockChange';
import OutOfStockModal from './OutOfStockModal';
import TopSalesPieChart from './TopSalesPieChart';

const { Title, Text } = Typography;

const OverviewMain = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [error, setError] = useState(null);


  useEffect(() => {
    fetchStats();
  }, []);

  // 获取统计数据（只读缓存）
  const fetchStats = async (autoCreate = true) => {
    try {
      setLoading(true);
      const response = await fetch('/api/overview/stats');
      if (response.status === 503 && autoCreate) {
        // 自动刷新并重试
        await fetch('/api/overview/stats', { method: 'POST' });
        return await fetchStats(false);
      }
      if (!response.ok) throw new Error('统计数据未生成，请先刷新');
      const result = await response.json();
      setStats(result);
      setError(null);
    } catch (err) {
      setError('获取数据失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 刷新统计数据（POST，刷新后再GET）
  const refreshStats = async () => {
    try {
      setLoading(true);
      await fetch('/api/overview/stats', { method: 'POST' });
      await fetchStats();
    } catch (err) {
      setError('刷新数据失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理数据格式
  const overview = stats.overview || {};
  const outOfStockCount = Array.isArray(stats.out_of_stock_products) ? stats.out_of_stock_products.length : 0;
  const outOfStockProducts = Array.isArray(stats.out_of_stock_products)
    ? stats.out_of_stock_products.map(item => ({ product_model: item.product_model }))
    : [];
  const [modalVisible, setModalVisible] = useState(false);

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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e9f5ff 100%)',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.04)',
        transition: 'border-radius 0.3s',
      }}
    >
      {/* 页面标题区域 */}
      <div
        style={{
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 8px',
        }}
      >
        <div>
          <Title
            level={1}
            style={{
              color: '#222',
              margin: 0,
              fontSize: '36px',
              fontWeight: 'bold',
              letterSpacing: 2,
            }}
          >
            系统总览
          </Title>
          <Text style={{ color: '#888', fontSize: '16px' }}>
            系统数据分析中心
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
              marginRight: '8px',
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
              marginRight: '8px',
            }}
          >
            快速出库
          </Button>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={refreshStats}
            loading={loading}
            size="large"
            style={{
              borderRadius: '12px',
              background: '#1677ff',
              border: 'none',
              color: 'white',
              boxShadow: '0 2px 8px rgba(22,119,255,0.08)',
            }}
          >
            重新分析数据
          </Button>
        </Space>
      </div>

      {/* 主体区域：flex布局 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 24,
          minHeight: '600px',
        }}
      >
        {/* 左侧：销售额分布，1/3宽度，100%高度 */}
        <div style={{ flex: '0 0 33.33%', maxWidth: '33.33%', minWidth: 320, display: 'flex', flexDirection: 'column' }}>
          <TopSalesPieChart />
        </div>

        {/* 右侧：2/3宽度，纵向分两块 */}
        <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 上半部分：概览卡片，占右侧50%高度 */}
          <div style={{ minHeight: 0 }}>
            <Card
              title="概览"
              variant="outlined"
              style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', height: '180px' }}
              bodyStyle={{ height: '100%' }}
            >
              <Row gutter={16} style={{ height: '100%' }}>
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
          </div>

          {/* 下半部分：本月库存变化量和库存状态，各占1/2宽度 */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 24 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <MonthlyStockChange />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Card
                title={<span style={{ fontWeight: 600 }}>库存状态（缺货 {outOfStockCount}）</span>}
                bordered={false}
                style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', height: 370, width: '100%' }}
                bodyStyle={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <List
                    size="small"
                    dataSource={outOfStockProducts.slice(0, 5)}
                    locale={{ emptyText: '暂无缺货' }}
                    renderItem={item => (
                      <List.Item style={{ padding: '4px 0', alignItems: 'center' }}>
                        <List.Item.Meta
                          avatar={<Avatar style={{ backgroundColor: '#e6f4ff', color: '#1677ff', fontWeight: 600 }} size={24}>{item.product_model?.[0] || '?'}</Avatar>}
                          title={<span style={{ fontSize: 14, color: '#333' }}>{item.product_model}</span>}
                        />
                      </List.Item>
                    )}
                    style={{ marginBottom: 8, maxHeight: 140, overflow: 'hidden', width: '100%', background: 'none' }}
                  />
                  {outOfStockCount > 5 && (
                    <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>
                      仅显示部分，更多请点击查看详细
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, width: '100%' }}>
                    <Button type="primary" onClick={() => setModalVisible(true)}>
                      查看详细
                    </Button>
                  </div>
                  <OutOfStockModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    products={outOfStockProducts}
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewMain;
