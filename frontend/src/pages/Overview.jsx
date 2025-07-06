import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Spin, Alert, Typography, Button, Space, message } from 'antd';

const { Title } = Typography;

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  const [error, setError] = useState(null);

  // 添加调试信息
  console.log('Overview component is rendering');

  useEffect(() => {
    fetchAllTables();
  }, []);

  const fetchAllTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug/all-tables');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('获取数据失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 入库记录表列定义
  const inboundColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '供应商简称', dataIndex: 'supplier_short_name', key: 'supplier_short_name', width: 100 },
    { title: '供应商全称', dataIndex: 'supplier_full_name', key: 'supplier_full_name', width: 150 },
    { title: '产品型号', dataIndex: 'product_model', key: 'product_model', width: 120 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 80 },
    { title: '总价', dataIndex: 'total_price', key: 'total_price', width: 80 },
    { title: '入库日期', dataIndex: 'inbound_date', key: 'inbound_date', width: 100 },
    { title: '发票号码', dataIndex: 'invoice_number', key: 'invoice_number', width: 120 },
    { title: '付款金额', dataIndex: 'payment_amount', key: 'payment_amount', width: 80 },
    { title: '应付金额', dataIndex: 'payable_amount', key: 'payable_amount', width: 80 },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 100 },
  ];

  // 出库记录表列定义
  const outboundColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '客户简称', dataIndex: 'customer_short_name', key: 'customer_short_name', width: 100 },
    { title: '客户全称', dataIndex: 'customer_full_name', key: 'customer_full_name', width: 150 },
    { title: '产品型号', dataIndex: 'product_model', key: 'product_model', width: 120 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 80 },
    { title: '总价', dataIndex: 'total_price', key: 'total_price', width: 80 },
    { title: '出库日期', dataIndex: 'outbound_date', key: 'outbound_date', width: 100 },
    { title: '发票号码', dataIndex: 'invoice_number', key: 'invoice_number', width: 120 },
    { title: '回款金额', dataIndex: 'collection_amount', key: 'collection_amount', width: 80 },
    { title: '应收金额', dataIndex: 'receivable_amount', key: 'receivable_amount', width: 80 },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 100 },
  ];

  // 库存表列定义
  const stockColumns = [
    { title: '记录ID', dataIndex: 'record_id', key: 'record_id', width: 80 },
    { title: '产品型号', dataIndex: 'product_model', key: 'product_model', width: 150 },
    { title: '库存数量', dataIndex: 'stock_quantity', key: 'stock_quantity', width: 100 },
    { title: '更新时间', dataIndex: 'update_time', key: 'update_time', width: 180 },
  ];

  // 客户/供应商表列定义
  const partnersColumns = [
    { title: '简称', dataIndex: 'short_name', key: 'short_name', width: 100 },
    { title: '全称', dataIndex: 'full_name', key: 'full_name', width: 200 },
    { title: '地址', dataIndex: 'address', key: 'address', width: 200 },
    { title: '联系人', dataIndex: 'contact_person', key: 'contact_person', width: 100 },
    { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone', width: 120 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 80, render: (type) => type === 0 ? '供应商' : '客户' },
  ];

  // 产品表列定义
  const productsColumns = [
    { title: '简称', dataIndex: 'short_name', key: 'short_name', width: 100 },
    { title: '产品类别', dataIndex: 'category', key: 'category', width: 120 },
    { title: '产品型号', dataIndex: 'product_model', key: 'product_model', width: 150 },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 200 },
  ];

  // 产品价格表列定义
  const productPricesColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '合作伙伴简称', dataIndex: 'partner_short_name', key: 'partner_short_name', width: 120 },
    { title: '产品型号', dataIndex: 'product_model', key: 'product_model', width: 150 },
    { title: '生效日期', dataIndex: 'effective_date', key: 'effective_date', width: 100 },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 80 },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>正在加载数据...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="数据加载失败"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>数据库总览 - 调试页面</Title>
        <Space>
          <Button onClick={fetchAllTables} loading={loading}>
            刷新数据
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="入库记录表 (inbound_records)" size="small">
            <Table
              columns={inboundColumns}
              dataSource={data.inbound_records || []}
              rowKey="id"
              size="small"
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="出库记录表 (outbound_records)" size="small">
            <Table
              columns={outboundColumns}
              dataSource={data.outbound_records || []}
              rowKey="id"
              size="small"
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="库存表 (stock)" size="small">
            <Table
              columns={stockColumns}
              dataSource={data.stock || []}
              rowKey={(record, index) => index}
              size="small"
              scroll={{ x: 600 }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="客户/供应商表 (partners)" size="small">
            <Table
              columns={partnersColumns}
              dataSource={data.partners || []}
              rowKey="short_name"
              size="small"
              scroll={{ x: 800 }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="产品表 (products)" size="small">
            <Table
              columns={productsColumns}
              dataSource={data.products || []}
              rowKey="short_name"
              size="small"
              scroll={{ x: 600 }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="产品价格表 (product_prices)" size="small">
            <Table
              columns={productPricesColumns}
              dataSource={data.product_prices || []}
              rowKey="id"
              size="small"
              scroll={{ x: 600 }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Overview;