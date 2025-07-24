import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Typography, Row, Col, Input, Button, message, Space, Tag, Divider } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Stock = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productFilter, setProductFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // 获取库存数据
  const fetchStockData = useCallback(async (page = 1, productModelFilter = productFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (productModelFilter) {
        params.append('product_model', productModelFilter);
      }
      const response = await fetch(`/api/stock?${params}`);
      const result = await response.json();
      if (response.ok && result.data) {
        setStockData(result.data);
        setPagination(result.pagination);
      } else {
        message.error(result.error || '获取库存数据失败');
      }
    } catch (error) {
      console.error('获取库存数据失败:', error);
      message.error('获取库存数据失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, productFilter]);

  useEffect(() => {
    fetchStockData(1);
  }, [fetchStockData]);

  // 刷新所有数据
  const handleRefresh = () => {
    fetchStockData(pagination.page);
  };

  // 刷新库存缓存
  const handleRefreshCache = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/stock/refresh', {
        method: 'POST',
      });
      const result = await response.json();
      if (response.ok) {
        message.success('库存已重新计算');
        fetchStockData(1);
      } else {
        message.error('库存重新计算失败');
      }
    } catch (error) {
      console.error('库存缓存刷新失败:', error);
      message.error('库存缓存刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 处理产品筛选变化
  const handleProductFilterChange = (value) => {
    setProductFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchStockData(1, value);
  };

  // 库存明细表格列定义
  const stockColumns = [
    {
      title: '产品型号',
      dataIndex: 'product_model',
      key: 'product_model',
      width: 200,
      sorter: (a, b) => (a.product_model || '').localeCompare(b.product_model || ''),
    },
    {
      title: '当前库存',
      dataIndex: 'current_stock',
      key: 'current_stock',
      width: 120,
      sorter: (a, b) => (a.current_stock || 0) - (b.current_stock || 0),
      render: (quantity) => {
        let color = 'green';
        if (quantity === 0) color = 'red';
        else if (quantity < 10) color = 'orange';
        return <Tag color={color}>{quantity}</Tag>;
      },
    },
    {
      title: '库存状态',
      key: 'stock_status',
      width: 100,
      render: (_, record) => {
        const quantity = record.current_stock || 0;
        if (quantity === 0) return <Tag color="red">缺货</Tag>;
        if (quantity < 10) return <Tag color="orange">库存不足</Tag>;
        return <Tag color="green">正常</Tag>;
      },
    },
    {
      title: '最后更新时间',
      dataIndex: 'last_update',
      key: 'last_update',
      width: 180,
      sorter: (a, b) => new Date(a.last_update || 0) - new Date(b.last_update || 0),
    },
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>库存明细</Title>
          </Col>
          <Col>
            <Space>
              <Input
                placeholder="搜索产品型号"
                prefix={<SearchOutlined />}
                value={productFilter}
                onChange={(e) => handleProductFilterChange(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Button
                type="primary"
                icon={<ReloadOutlined spin={refreshing} />}
                onClick={handleRefreshCache}
                loading={refreshing}
              >
                重新计算库存
              </Button>
            </Space>
          </Col>
        </Row>
        <Divider />
        <div className="responsive-table">
          <Table
            columns={stockColumns}
            dataSource={stockData}
            rowKey="product_model"
            loading={loading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              onChange: (page) => {
                setPagination(prev => ({ ...prev, page }));
                fetchStockData(page);
              },
            }}
            scroll={{ x: 600 }}
          />
        </div>
      </Card>
    </div>
  );
};

export default Stock;
