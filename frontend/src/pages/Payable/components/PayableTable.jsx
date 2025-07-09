import React, { useState } from 'react';
import { Table, Button, Popconfirm, Tag, message, Modal, Input, Space, Typography, Row, Col } from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Text } = Typography;

const PayableTable = ({
  data,
  loading,
  pagination,
  filters,
  sorter,
  onFilter,
  onTableChange,
  onAddPayment,
  onEditPayment,
  onDeletePayment
}) => {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierDetails, setSupplierDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // 格式化金额显示
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '¥0.00';
    return `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 获取余额状态标签
  const getBalanceTag = (balance) => {
    if (balance > 0) {
      return <Tag color="volcano">未付: {formatCurrency(balance)}</Tag>;
    } else if (balance < 0) {
      return <Tag color="green">超付: {formatCurrency(Math.abs(balance))}</Tag>;
    } else {
      return <Tag color="blue">已结清</Tag>;
    }
  };

  // 查看供应商详情
  const handleViewDetails = async (record) => {
    try {
      setDetailsLoading(true);
      setSelectedSupplier(record);
      setDetailsVisible(true);
      
      const response = await fetch(`/api/payable/details/${record.supplier_code}`);
      if (response.ok) {
        const result = await response.json();
        setSupplierDetails(result);
      } else {
        const error = await response.json();
        message.error(`获取供应商详情失败: ${error.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('获取供应商详情失败:', error);
      message.error('获取供应商详情失败，请检查网络连接');
    } finally {
      setDetailsLoading(false);
    }
  };

  // 筛选处理
  const handleSearch = (value) => {
    onFilter({ supplier_short_name: value || undefined });
  };

  // 删除付款记录确认
  const handleDeletePaymentConfirm = async (paymentId) => {
    await onDeletePayment(paymentId);
    if (detailsVisible && selectedSupplier) {
      // 如果详情窗口打开，重新获取详情
      handleViewDetails(selectedSupplier);
    }
  };

  const columns = [
    {
      title: '供应商代号',
      dataIndex: 'supplier_code',
      key: 'supplier_code',
      width: 120,
      sorter: true,
      sortOrder: sorter.field === 'supplier_code' ? sorter.order : null,
    },
    {
      title: '供应商简称',
      dataIndex: 'supplier_short_name',
      key: 'supplier_short_name',
      width: 150,
      sorter: true,
      sortOrder: sorter.field === 'supplier_short_name' ? sorter.order : null,
    },
    {
      title: '供应商全称',
      dataIndex: 'supplier_full_name',
      key: 'supplier_full_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '应付金额',
      dataIndex: 'total_payable',
      key: 'total_payable',
      width: 120,
      align: 'right',
      sorter: true,
      sortOrder: sorter.field === 'total_payable' ? sorter.order : null,
      render: (value) => formatCurrency(value),
    },
    {
      title: '已付金额',
      dataIndex: 'total_paid',
      key: 'total_paid',
      width: 120,
      align: 'right',
      sorter: true,
      sortOrder: sorter.field === 'total_paid' ? sorter.order : null,
      render: (value) => formatCurrency(value),
    },
    {
      title: '应付余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 130,
      align: 'right',
      sorter: true,
      sortOrder: sorter.field === 'balance' ? sorter.order : null,
      render: (value) => getBalanceTag(value),
    },
    {
      title: '最近付款',
      dataIndex: 'last_payment_date',
      key: 'last_payment_date',
      width: 120,
      sorter: true,
      sortOrder: sorter.field === 'last_payment_date' ? sorter.order : null,
      render: (value) => value || '-',
    },
    {
      title: '付款方式',
      dataIndex: 'last_payment_method',
      key: 'last_payment_method',
      width: 100,
      render: (value) => value || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => onAddPayment(record)}
          >
            新增付款
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Search
            placeholder="搜索供应商简称"
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
            defaultValue={filters.supplier_short_name}
          />
        </Col>
        <Col>
          <Text type="secondary">
            共 {pagination.total} 个供应商，应付总额: {formatCurrency(
              data.reduce((sum, item) => sum + (item.total_payable || 0), 0)
            )}，
            未付总额: {formatCurrency(
              data.reduce((sum, item) => sum + Math.max(item.balance || 0, 0), 0)
            )}
          </Text>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="supplier_code"
        loading={loading}
        pagination={{
          ...pagination,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        onChange={onTableChange}
        scroll={{ x: 1200 }}
        size="middle"
      />

      {/* 供应商详情弹窗 */}
      <Modal
        title={`供应商详情 - ${selectedSupplier?.supplier_short_name || ''}`}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        {detailsLoading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>
        ) : supplierDetails ? (
          <div>
            {/* 供应商基本信息 */}
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5}>供应商信息</Typography.Title>
              <Row gutter={16}>
                <Col span={8}>供应商代号: {supplierDetails.supplier?.code}</Col>
                <Col span={8}>供应商简称: {supplierDetails.supplier?.short_name}</Col>
                <Col span={8}>供应商全称: {supplierDetails.supplier?.full_name}</Col>
              </Row>
            </div>

            {/* 账款汇总 */}
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5}>账款汇总</Typography.Title>
              <Row gutter={16}>
                <Col span={8}>应付金额: {formatCurrency(supplierDetails.summary?.total_payable)}</Col>
                <Col span={8}>已付金额: {formatCurrency(supplierDetails.summary?.total_paid)}</Col>
                <Col span={8}>应付余额: {getBalanceTag(supplierDetails.summary?.balance)}</Col>
              </Row>
            </div>

            {/* 付款记录 */}
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5}>
                付款记录
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  style={{ marginLeft: 16 }}
                  onClick={() => {
                    setDetailsVisible(false);
                    onAddPayment(selectedSupplier);
                  }}
                >
                  新增付款
                </Button>
              </Typography.Title>
              <Table
                size="small"
                dataSource={supplierDetails.payment_records || []}
                rowKey="id"
                pagination={false}
                scroll={{ y: 200 }}
                columns={[
                  { title: '付款金额', dataIndex: 'amount', render: (value) => formatCurrency(value) },
                  { title: '付款日期', dataIndex: 'pay_date' },
                  { title: '付款方式', dataIndex: 'pay_method' },
                  { title: '备注', dataIndex: 'remark', ellipsis: true },
                  {
                    title: '操作',
                    width: 100,
                    render: (_, record) => (
                      <Space>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => {
                            setDetailsVisible(false);
                            onEditPayment(record, selectedSupplier);
                          }}
                        >
                          编辑
                        </Button>
                        <Popconfirm
                          title="确定删除这条付款记录吗？"
                          onConfirm={() => handleDeletePaymentConfirm(record.id)}
                        >
                          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />
            </div>

            {/* 入库记录 */}
            <div>
              <Typography.Title level={5}>入库记录</Typography.Title>
              <Table
                size="small"
                dataSource={supplierDetails.inbound_records || []}
                rowKey="id"
                pagination={false}
                scroll={{ y: 200 }}
                columns={[
                  { title: '入库日期', dataIndex: 'inbound_date', width: 100 },
                  { title: '产品型号', dataIndex: 'product_model', width: 120 },
                  { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' },
                  { title: '单价', dataIndex: 'unit_price', width: 100, align: 'right', render: (value) => formatCurrency(value) },
                  { title: '总价', dataIndex: 'total_price', width: 100, align: 'right', render: (value) => formatCurrency(value) },
                  { title: '订单号', dataIndex: 'order_number', width: 120, ellipsis: true },
                  { title: '备注', dataIndex: 'remark', ellipsis: true },
                ]}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
};

export default PayableTable;
