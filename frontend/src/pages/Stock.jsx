import React, { useState, useEffect, useCallback } from 'react';
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
  Tag,
  Modal,
  Progress
} from 'antd';
import { SearchOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const Stock = () => {
  const [stockData, setStockData] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [productFilter, setProductFilter] = useState('');
  const [products, setProducts] = useState([]);
  const [rebuildModalVisible, setRebuildModalVisible] = useState(false);
  const [rebuildModalLoading, setRebuildModalLoading] = useState(false);
  const [progress, setProgress] = useState({ total: 0, current: 0, running: false });
  const [progressTimer, setProgressTimer] = useState(null);
  // 添加分页状态
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // 获取库存数据
  const fetchStockData = useCallback(async (page = 1, productModelFilter = productFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (productModelFilter) {
        params.append('product_model', productModelFilter);
      }
      
      const response = await fetch(`/api/stock?${params}`);
      if (response.ok) {
        const result = await response.json();
        setStockData(Array.isArray(result.data) ? result.data : []);
        if (result.pagination) {
          setPagination(result.pagination);
        }
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
  }, [pagination.limit, productFilter]);

  // 获取库存历史记录
  const fetchStockHistory = useCallback(async (page = 1, productModelFilter = productFilter) => {
    try {
      setHistoryLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: historyPagination.limit.toString(),
      });
      
      if (productModelFilter) {
        params.append('product_model', productModelFilter);
      }
      
      const response = await fetch(`/api/stock/history?${params}`);
      if (response.ok) {
        const result = await response.json();
        setStockHistory(Array.isArray(result.data) ? result.data : []);
        if (result.pagination) {
          setHistoryPagination(result.pagination);
        }
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
  }, [historyPagination.limit, productFilter]);

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
    fetchStockData(1);
    fetchStockHistory(1);
    fetchProducts();
  }, [fetchStockData, fetchStockHistory]);

  // 刷新所有数据
  const handleRefresh = () => {
    fetchStockData(pagination.page);
    fetchStockHistory(historyPagination.page);
  };

  // 处理产品筛选变化
  const handleProductFilterChange = (value) => {
    setProductFilter(value);
    setPagination(prev => ({ ...prev, page: 1 })); // 重置到第一页
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

  const showRebuildModal = () => setRebuildModalVisible(true);

  const pollProgress = () => {
    fetch('/api/stock-rebuild/progress')
      .then(res => res.json())
      .then(data => {
        setProgress(data);
        if (data.running) {
          setProgressTimer(setTimeout(pollProgress, 500));
        } else {
          setProgressTimer(null);
        }
      })
      .catch(() => setProgressTimer(null));
  };

  const handleRebuildOk = async () => {
    setRebuildModalLoading(true);
    setProgress({ total: 0, current: 0, running: true });
    const hide = message.loading('正在重建库存，请稍候...', 0);
    try {
      const response = await fetch('/api/stock-rebuild/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      pollProgress(); // 启动进度轮询
      const result = await response.json();
      if (response.ok && result.success) {
        message.success('库存重建成功！');
        // 重置分页并刷新数据
        setPagination(prev => ({ ...prev, page: 1 }));
        setHistoryPagination(prev => ({ ...prev, page: 1 }));
        fetchStockData(1);
        fetchStockHistory(1);
        setRebuildModalVisible(false);
      } else {
        message.error(result.error || '库存重建失败');
      }
    } catch (error) {
      message.error('库存重建失败: ' + error.message);
      console.error('重建库存请求异常:', error);
    } finally {
      setRebuildModalLoading(false);
      hide();
      setProgressTimer(null);
    }
  };

  const handleRebuildCancel = () => setRebuildModalVisible(false);

  React.useEffect(() => {
    return () => {
      if (progressTimer) clearTimeout(progressTimer);
    };
  }, [progressTimer]);

  return (
    <div>
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
                onChange={(e) => handleProductFilterChange(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="选择产品"
                style={{ width: 200 }}
                value={productFilter}
                onChange={handleProductFilterChange}
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
              <Button
                danger
                type="primary"
                onClick={showRebuildModal}
                loading={loading}
              >
                重建库存
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
            rowKey={(record, index) => `${record.record_id}-${index}`}
            loading={historyLoading}
            pagination={{
              current: historyPagination.page,
              pageSize: historyPagination.limit,
              total: historyPagination.total,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              onChange: (page) => {
                setHistoryPagination(prev => ({ ...prev, page }));
                fetchStockHistory(page);
              },
            }}
            scroll={{ x: 600 }}
          />
        </div>
      </Card>

      {/* 重建库存数据确认弹窗 */}
      <Modal
        title="重建库存数据"
        open={rebuildModalVisible}
        onOk={handleRebuildOk}
        onCancel={handleRebuildCancel}
        confirmLoading={rebuildModalLoading}
        okText="确定"
        cancelText="取消"
        maskClosable={false}
        destroyOnClose
      >
        <p>此操作将清空并重新计算所有库存数据，过程可能耗时较长，确定要继续吗？</p>
        {progress.running && progress.total > 0 && (
          <Progress
            percent={Math.round((progress.current / progress.total) * 100)}
            status={progress.current < progress.total ? 'active' : 'success'}
            style={{ marginTop: 16 }}
            format={p => `进度：${progress.current}/${progress.total} (${p}%)`}
          />
        )}
      </Modal>
    </div>
  );
};

export default Stock;
