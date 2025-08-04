import { useState, useEffect, useCallback } from 'react';
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
import { useTranslation } from 'react-i18next';

import MonthlyStockChange from './MonthlyStockChange';
import OutOfStockModal from './OutOfStockModal';
import TopSalesPieChart from './TopSalesPieChart';

const { Title, Text } = Typography;

const OverviewMain = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [error, setError] = useState(null);


  const fetchStats = useCallback(async (autoCreate = true) => {
    try {
      setLoading(true);
      const response = await fetch('/api/overview/stats');
      if (response.status === 503 && autoCreate) {
        // 自动刷新并重试
        await fetch('/api/overview/stats', { method: 'POST' });
        return await fetchStats(false);
      }
      if (!response.ok) throw new Error(t('overview.dataGenerationFailed'));
      const result = await response.json();
      setStats(result);
      setError(null);
    } catch (err) {
      setError(t('overview.fetchDataFailed') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 刷新统计数据（POST，刷新后再GET）
  const refreshStats = async () => {
    try {
      setLoading(true);
      await fetch('/api/overview/stats', { method: 'POST' });
      await fetchStats();
    } catch (err) {
      setError(t('overview.refreshFailed') + ': ' + err.message);
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


  // 计算利润率（基于已售商品成本）
  const calculateProfitMargin = () => {
    const soldGoodsCost = overview.sold_goods_cost || 0;
    const sales = overview.total_sales_amount || 0;
    if (soldGoodsCost === 0) return 0;
    return ((sales - soldGoodsCost) / sales * 100).toFixed(2);
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
          <p style={{ marginTop: '16px', color: '#666' }}>{t('overview.loading')}</p>
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
          message={t('overview.loadFailed')}
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
            {t('overview.title')}
          </Title>
          <Text style={{ color: '#888', fontSize: '16px' }}>
            {t('overview.subtitle')}
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
            {t('overview.quickInbound')}
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
            {t('overview.quickOutbound')}
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
            {t('overview.refreshData')}
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
              title={t('overview.overview')}
              variant="outlined"
              style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', height: '180px' }}
              styles={{
                body: {
                  height: '100%',
                },
              }}
            >
              <Row gutter={16} style={{ height: '100%' }}>
                <Col span={6}>
                  <Statistic
                    title={t('overview.totalSales')}
                    value={overview.total_sales_amount}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={t('overview.totalCost')}
                    value={overview.sold_goods_cost}
                    prefix={<ShoppingCartOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={t('overview.profitMargin')}
                    value={calculateProfitMargin()}
                    suffix="%"
                    prefix={<RiseOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={t('overview.totalPurchase')}
                    value={overview.total_purchase_amount}
                    prefix={<ShoppingCartOutlined />}
                    valueStyle={{ color: '#1677ff' }}
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
                title={<span style={{ fontWeight: 600 }}>{t('overview.stockStatus')}</span>}
                bordered={false}
                style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', height: '370px', width: '100%' }}
                bodyStyle={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <List
                    size="small"
                    dataSource={outOfStockProducts.slice(0, 5)}
                    locale={{ emptyText: t('overview.noOutOfStock') }}
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
                      {t('overview.partialDisplay')}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, width: '100%' }}>
                    <Button type="primary" onClick={() => setModalVisible(true)}>
                      {t('overview.viewDetails')}
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
