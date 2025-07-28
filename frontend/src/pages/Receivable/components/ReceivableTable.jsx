import React, { useState } from 'react';
import { Table, Button, Popconfirm, Tag, message, Modal, Input, Space, Typography, Row, Col } from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Text } = Typography;

const ReceivableTable = ({
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
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // 详情弹窗分页状态
  const [paymentPagination, setPaymentPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });
  const [outboundPagination, setOutboundPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });

  // 格式化金额显示
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '¥0.00';
    return `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 获取余额状态标签
  const getBalanceTag = (balance) => {
    if (balance > 0) {
      return <Tag color="volcano">未收: {formatCurrency(balance)}</Tag>;
    } else if (balance < 0) {
      return <Tag color="green">超收: {formatCurrency(Math.abs(balance))}</Tag>;
    } else {
      return <Tag color="blue">已结清</Tag>;
    }
  };

  // 查看客户详情
  const handleViewDetails = async (record) => {
    try {
      setDetailsLoading(true);
      setSelectedCustomer(record);
      setDetailsVisible(true);
      
      // 重置分页状态
      setPaymentPagination({ current: 1, pageSize: 5, total: 0 });
      setOutboundPagination({ current: 1, pageSize: 5, total: 0 });
      
      await fetchCustomerDetails(record.customer_code, 1, 1);
    } catch (error) {
      console.error('获取客户详情失败:', error);
      message.error('获取客户详情失败，请检查网络连接');
    } finally {
      setDetailsLoading(false);
    }
  };

  // 获取客户详情数据
  const fetchCustomerDetails = async (customerCode, paymentPage = 1, outboundPage = 1) => {
    try {
      const query = new URLSearchParams({
        payment_page: paymentPage,
        payment_limit: 5,
        outbound_page: outboundPage,
        outbound_limit: 5
      });
      
      const response = await fetch(`/api/receivable/details/${customerCode}?${query.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setCustomerDetails(result);
        
        // 更新分页状态
        setPaymentPagination({
          current: result.payment_records.page,
          pageSize: result.payment_records.limit,
          total: result.payment_records.total
        });
        setOutboundPagination({
          current: result.outbound_records.page,
          pageSize: result.outbound_records.limit,
          total: result.outbound_records.total
        });
      } else {
        const error = await response.json();
        message.error(`获取客户详情失败: ${error.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('获取客户详情失败:', error);
      message.error('获取客户详情失败，请检查网络连接');
    }
  };

  // 处理回款记录分页变化
  const handlePaymentPageChange = (page) => {
    if (selectedCustomer) {
      fetchCustomerDetails(selectedCustomer.customer_code, page, outboundPagination.current);
    }
  };

  // 处理出库记录分页变化
  const handleOutboundPageChange = (page) => {
    if (selectedCustomer) {
      fetchCustomerDetails(selectedCustomer.customer_code, paymentPagination.current, page);
    }
  };

  // 筛选处理
  const handleSearch = (value) => {
    onFilter({ customer_short_name: value || undefined });
  };

  // 删除回款记录确认
  const handleDeletePaymentConfirm = async (paymentId) => {
    await onDeletePayment(paymentId);
    if (detailsVisible && selectedCustomer) {
      // 如果详情窗口打开，重新获取当前页详情
      await fetchCustomerDetails(
        selectedCustomer.customer_code, 
        paymentPagination.current, 
        outboundPagination.current
      );
    }
  };

  const columns = [
    {
      title: '客户代号',
      dataIndex: 'customer_code',
      key: 'customer_code',
      width: 120,
      sorter: true,
      sortOrder: sorter.field === 'customer_code' ? sorter.order : null,
    },
    {
      title: '客户简称',
      dataIndex: 'customer_short_name',
      key: 'customer_short_name',
      width: 150,
      sorter: true,
      sortOrder: sorter.field === 'customer_short_name' ? sorter.order : null,
    },
    {
      title: '客户全称',
      dataIndex: 'customer_full_name',
      key: 'customer_full_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '应收金额',
      dataIndex: 'total_receivable',
      key: 'total_receivable',
      width: 120,
      align: 'right',
      sorter: true,
      sortOrder: sorter.field === 'total_receivable' ? sorter.order : null,
      render: (value) => formatCurrency(value),
    },
    {
      title: '已收金额',
      dataIndex: 'total_paid',
      key: 'total_paid',
      width: 120,
      align: 'right',
      sorter: true,
      sortOrder: sorter.field === 'total_paid' ? sorter.order : null,
      render: (value) => formatCurrency(value),
    },
    {
      title: '应收余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 130,
      align: 'right',
      sorter: true,
      sortOrder: sorter.field === 'balance' ? sorter.order : null,
      render: (value) => getBalanceTag(value),
    },
    {
      title: '最近回款',
      dataIndex: 'last_payment_date',
      key: 'last_payment_date',
      width: 120,
      sorter: true,
      sortOrder: sorter.field === 'last_payment_date' ? sorter.order : null,
      render: (value) => value || '-',
    },
    {
      title: '回款方式',
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
            新增回款
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
            placeholder="搜索客户简称"
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
            defaultValue={filters.customer_short_name}
          />
        </Col>
        <Col>
          <Text type="secondary">
            共 {pagination.total} 个客户，应收总额: {formatCurrency(
              data.reduce((sum, item) => sum + (item.total_receivable || 0), 0)
            )}，
            未收总额: {formatCurrency(
              data.reduce((sum, item) => sum + Math.max(item.balance || 0, 0), 0)
            )}
          </Text>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="customer_code"
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

      {/* 客户详情弹窗 */}
      <Modal
        title={`客户详情 - ${selectedCustomer?.customer_short_name || ''}`}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        {detailsLoading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>
        ) : customerDetails ? (
          <div>
            {/* 客户基本信息 */}
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5}>客户信息</Typography.Title>
              <Row gutter={16}>
                <Col span={8}>客户代号: {customerDetails.customer?.code}</Col>
                <Col span={8}>客户简称: {customerDetails.customer?.short_name}</Col>
                <Col span={8}>客户全称: {customerDetails.customer?.full_name}</Col>
              </Row>
            </div>

            {/* 账款汇总 */}
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5}>账款汇总</Typography.Title>
              <Row gutter={16}>
                <Col span={8}>应收金额: {formatCurrency(customerDetails.summary?.total_receivable)}</Col>
                <Col span={8}>已收金额: {formatCurrency(customerDetails.summary?.total_paid)}</Col>
                <Col span={8}>应收余额: {getBalanceTag(customerDetails.summary?.balance)}</Col>
              </Row>
            </div>

            {/* 回款记录 */}
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5}>
                回款记录
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  style={{ marginLeft: 16 }}
                  onClick={() => {
                    setDetailsVisible(false);
                    onAddPayment(selectedCustomer);
                  }}
                >
                  新增回款
                </Button>
              </Typography.Title>
              <Table
                size="small"
                dataSource={customerDetails.payment_records?.data || []}
                rowKey="id"
                pagination={{
                  ...paymentPagination,
                  showSizeChanger: false,
                  size: 'small',
                  onChange: handlePaymentPageChange,
                  showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`
                }}
                scroll={{ y: 200 }}
                columns={[
                  { title: '回款金额', dataIndex: 'amount', render: (value) => formatCurrency(value) },
                  { title: '回款日期', dataIndex: 'pay_date' },
                  { title: '回款方式', dataIndex: 'pay_method' },
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
                            onEditPayment(record, selectedCustomer);
                          }}
                        >
                          编辑
                        </Button>
                        <Popconfirm
                          title="确定删除这条回款记录吗？"
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

            {/* 出库记录 */}
            <div>
              <Typography.Title level={5}>出库记录</Typography.Title>
              <Table
                size="small"
                dataSource={customerDetails.outbound_records?.data || []}
                rowKey="id"
                pagination={{
                  ...outboundPagination,
                  showSizeChanger: false,
                  size: 'small',
                  onChange: handleOutboundPageChange,
                  showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`
                }}
                scroll={{ y: 200 }}
                columns={[
                  { title: '出库日期', dataIndex: 'outbound_date', width: 100 },
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

export default ReceivableTable;
