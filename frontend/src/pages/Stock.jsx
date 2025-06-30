import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Typography,
  Row,
  Col,
  Divider,
  Select,
  Input,
  Button,
  Space,
  message,
  Statistic,
  Tag
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const Stock = () => {
  const [stockData, setStockData] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [productFilter, setProductFilter] = useState('');
  const [products, setProducts] = useState([]);

  // 获取库存数据
  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stock');
      if (response.ok) {
        const result = await response.json();
        // API返回格式为 {data: [...]}
        setStockData(Array.isArray(result.data) ? result.data : []);
      } else {
        console.error('获取库存数据失败');
        setStockData([]);
      }
    } catch (error) {
      console.error('获取库存数据失败:', error);
      setStockData([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取库存历史记录
  const fetchStockHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch('/api/stock/history');
      if (response.ok) {
        const data = await response.json();
        setStockHistory(Array.isArray(data) ? data : []);
      } else {
        console.error('获取库存历史失败');
        setStockHistory([]);
      }
    } catch (error) {
      console.error('获取库存历史失败:', error);
      setStockHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 获取产品列表用于筛选
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
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
    fetchStockData();
    fetchStockHistory();
    fetchProducts();
  }, []);

  // 刷新所有数据
  const handleRefresh = () => {
    fetchStockData();
    fetchStockHistory();
  };

  // 筛选库存数据
  const filteredStockData = stockData.filter(item => {
    if (!productFilter) return true;
    return item.product_model && item.product_model.toLowerCase().includes(productFilter.toLowerCase());
  });

  // 计算统计数据
  const totalProducts = filteredStockData.length;
  const totalQuantity = filteredStockData.reduce((sum, item) => sum + (item.stock_quantity || 0), 0);
  const lowStockCount = filteredStockData.filter(item => (item.stock_quantity || 0) < 10).length;
  const outOfStockCount = filteredStockData.filter(item => (item.stock_quantity || 0) === 0).length;

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
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 120,
      sorter: (a, b) => (a.stock_quantity || 0) - (b.stock_quantity || 0),
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
        const quantity = record.stock_quantity || 0;
        if (quantity === 0) return <Tag color="red">缺货</Tag>;
        if (quantity < 10) return <Tag color="orange">库存不足</Tag>;
        return <Tag color="green">正常</Tag>;
      },
    },
    {
      title: '最后更新时间',
      dataIndex: 'update_time',
      key: 'update_time',
      width: 180,
      sorter: (a, b) => new Date(a.update_time || 0) - new Date(b.update_time || 0),
    },
  ];

  // 库存历史表格列定义
  const historyColumns = [
    {
      title: '记录ID',
      dataIndex: 'record_id',
      key: 'record_id',
      width: 100,
    },
    {
      title: '产品型号',
      dataIndex: 'product_model',
      key: 'product_model',
      width: 200,
    },
    {
      title: '库存数量',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 120,
      render: (quantity) => <Tag>{quantity}</Tag>,
    },
    {
      title: '更新时间',
      dataIndex: 'update_time',
      key: 'update_time',
      width: 180,
      sorter: (a, b) => new Date(a.update_time || 0) - new Date(b.update_time || 0),
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="产品种类"
              value={totalProducts}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总库存量"
              value={totalQuantity}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="库存不足"
              value={lowStockCount}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="缺货产品"
              value={outOfStockCount}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 库存明细 */}
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
                onChange={(e) => setProductFilter(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="选择产品"
                style={{ width: 200 }}
                value={productFilter}
                onChange={setProductFilter}
                allowClear
                showSearch
              >
                {products.map(product => (
                  <Option key={product.product_model} value={product.product_model}>
                    {product.product_model}
                  </Option>
                ))}
              </Select>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>

        <Divider />

        <div className="responsive-table">
          <Table
            columns={stockColumns}
            dataSource={filteredStockData}
            rowKey="product_model"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            }}
            scroll={{ x: 600 }}
          />
        </div>
      </Card>

      {/* 库存历史记录 */}
      <Card style={{ marginTop: 16 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>库存历史记录</Title>
          </Col>
        </Row>

        <Divider />

        <div className="responsive-table">
          <Table
            columns={historyColumns}
            dataSource={stockHistory}
            rowKey="record_id"
            loading={historyLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            }}
            scroll={{ x: 600 }}
          />
        </div>
      </Card>
    </div>
  );
};

export default Stock;
