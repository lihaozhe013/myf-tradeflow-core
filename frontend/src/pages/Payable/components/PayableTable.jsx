import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  
  // 详情弹窗分页状态
  const [paymentPagination, setPaymentPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });
  const [inboundPagination, setInboundPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });

  const { t } = useTranslation();
  // 格式化金额显示
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '¥0.00';
    return `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 获取余额状态标签
  const getBalanceTag = (balance) => {
    if (balance > 0) {
      return <Tag color="volcano">{t('payable.unpaid', { amount: formatCurrency(balance) })}</Tag>;
    } else if (balance < 0) {
      return <Tag color="green">{t('payable.overpaid', { amount: formatCurrency(Math.abs(balance)) })}</Tag>;
    } else {
      return <Tag color="blue">{t('payable.paid')}</Tag>;
    }
  };

  // 查看供应商详情
  const handleViewDetails = async (record) => {
    try {
      setDetailsLoading(true);
      setSelectedSupplier(record);
      setDetailsVisible(true);
      
      // 重置分页状态
      setPaymentPagination({ current: 1, pageSize: 5, total: 0 });
      setInboundPagination({ current: 1, pageSize: 5, total: 0 });
      
      await fetchSupplierDetails(record.supplier_code, 1, 1);
    } catch (error) {
      console.error('获取供应商详情失败:', error);
      message.error(t('payable.fetchFailedNetwork'));
    } finally {
      setDetailsLoading(false);
    }
  };

  // 获取供应商详情数据
  const fetchSupplierDetails = async (supplierCode, paymentPage = 1, inboundPage = 1) => {
    try {
      const query = new URLSearchParams({
        payment_page: paymentPage,
        payment_limit: 5,
        inbound_page: inboundPage,
        inbound_limit: 5
      });
      
      const response = await fetch(`/api/payable/details/${supplierCode}?${query.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setSupplierDetails(result);
        
        // 更新分页状态
        setPaymentPagination({
          current: result.payment_records.page,
          pageSize: result.payment_records.limit,
          total: result.payment_records.total
        });
        setInboundPagination({
          current: result.inbound_records.page,
          pageSize: result.inbound_records.limit,
          total: result.inbound_records.total
        });
      } else {
        const error = await response.json();
        message.error(t('payable.fetchFailed', { msg: error.error || t('payable.unknownError') }));
      }
    } catch (error) {
      console.error('获取供应商详情失败:', error);
      message.error(t('payable.fetchFailedNetwork'));
    }
  };

  // 处理付款记录分页变化
  const handlePaymentPageChange = (page) => {
    if (selectedSupplier) {
      fetchSupplierDetails(selectedSupplier.supplier_code, page, inboundPagination.current);
    }
  };

  // 处理入库记录分页变化
  const handleInboundPageChange = (page) => {
    if (selectedSupplier) {
      fetchSupplierDetails(selectedSupplier.supplier_code, paymentPagination.current, page);
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
      // 如果详情窗口打开，重新获取当前页详情
      await fetchSupplierDetails(
        selectedSupplier.supplier_code, 
        paymentPagination.current, 
        inboundPagination.current
      );
    }
  };

  const columns = [
    {
      title: t('payable.supplierCode'),
      dataIndex: 'supplier_code',
      key: 'supplier_code',
      width: 120,
      sorter: true,
      sortOrder: sorter.field === 'supplier_code' ? sorter.order : null,
    },
    {
      title: t('payable.supplierShortName'),
      dataIndex: 'supplier_short_name',
      key: 'supplier_short_name',
      width: 150,
      sorter: true,
      sortOrder: sorter.field === 'supplier_short_name' ? sorter.order : null,
    },
    {
      title: t('payable.supplierFullName'),
      dataIndex: 'supplier_full_name',
      key: 'supplier_full_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('payable.totalPayable'),
      dataIndex: 'total_payable',
      key: 'total_payable',
      width: 120,
      align: 'right',
      sorter: true,
      sortOrder: sorter.field === 'total_payable' ? sorter.order : null,
      render: (value) => formatCurrency(value),
    },
    {
      title: t('payable.totalPaid'),
      dataIndex: 'total_paid',
      key: 'total_paid',
      width: 120,
      align: 'right',
      sorter: true,
      sortOrder: sorter.field === 'total_paid' ? sorter.order : null,
      render: (value) => formatCurrency(value),
    },
    {
      title: t('payable.balance'),
      dataIndex: 'balance',
      key: 'balance',
      width: 130,
      align: 'right',
      sorter: true,
      sortOrder: sorter.field === 'balance' ? sorter.order : null,
      render: (value) => getBalanceTag(value),
    },
    {
      title: t('payable.lastPaymentDate'),
      dataIndex: 'last_payment_date',
      key: 'last_payment_date',
      width: 120,
      sorter: true,
      sortOrder: sorter.field === 'last_payment_date' ? sorter.order : null,
      render: (value) => value || '-',
    },
    {
      title: t('payable.lastPaymentMethod'),
      dataIndex: 'last_payment_method',
      key: 'last_payment_method',
      width: 100,
      render: (value) => value || '-',
    },
    {
      title: t('payable.action'),
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
            {t('payable.details')}
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => onAddPayment(record)}
          >
            {t('payable.addPayment')}
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
            placeholder={t('payable.searchSupplier')}
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
            defaultValue={filters.supplier_short_name}
          />
        </Col>
        <Col>
          <Text type="secondary">
            {t('payable.totalSuppliers', {
              count: pagination.total,
              totalPayable: formatCurrency(data.reduce((sum, item) => sum + (item.total_payable || 0), 0)),
              totalUnpaid: formatCurrency(data.reduce((sum, item) => sum + Math.max(item.balance || 0, 0), 0))
            })}
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
          showTotal: (total, range) => t('payable.paginationTotal', { start: range[0], end: range[1], total }),
        }}
        onChange={onTableChange}
        scroll={{ x: 1200 }}
        size="middle"
      />

      {/* 供应商详情弹窗 */}
      <Modal
        title={t('payable.details') + ' - ' + (selectedSupplier?.supplier_short_name || '')}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        {detailsLoading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>{t('payable.loading')}</div>
        ) : supplierDetails ? (
          <div>
            {/* 供应商基本信息 */}
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5}>{t('payable.supplierInfo')}</Typography.Title>
              <Row gutter={16}>
                <Col span={8}>{t('payable.supplierCode')}: {supplierDetails.supplier?.code}</Col>
                <Col span={8}>{t('payable.supplierShortName')}: {supplierDetails.supplier?.short_name}</Col>
                <Col span={8}>{t('payable.supplierFullName')}: {supplierDetails.supplier?.full_name}</Col>
              </Row>
            </div>

            {/* 账款汇总 */}
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5}>{t('payable.summary')}</Typography.Title>
              <Row gutter={16}>
                <Col span={8}>{t('payable.totalPayable')}: {formatCurrency(supplierDetails.summary?.total_payable)}</Col>
                <Col span={8}>{t('payable.totalPaid')}: {formatCurrency(supplierDetails.summary?.total_paid)}</Col>
                <Col span={8}>{t('payable.balance')}: {getBalanceTag(supplierDetails.summary?.balance)}</Col>
              </Row>
            </div>

            {/* 付款记录 */}
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5}>
                {t('payable.paymentRecords')}
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
                  {t('payable.addPayment')}
                </Button>
              </Typography.Title>
              <Table
                size="small"
                dataSource={supplierDetails.payment_records?.data || []}
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
                  { title: t('payable.paymentAmount'), dataIndex: 'amount', render: (value) => formatCurrency(value) },
                  { title: t('payable.paymentDate'), dataIndex: 'pay_date' },
                  { title: t('payable.paymentMethod'), dataIndex: 'pay_method' },
                  { title: t('payable.remark'), dataIndex: 'remark', ellipsis: true },
                  {
                    title: t('payable.action'),
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
                          {t('payable.editPayment')}
                        </Button>
                        <Popconfirm
                          title={t('payable.deletePaymentConfirm')}
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
              <Typography.Title level={5}>{t('payable.inboundRecords')}</Typography.Title>
              <Table
                size="small"
                dataSource={supplierDetails.inbound_records?.data || []}
                rowKey="id"
                pagination={{
                  ...inboundPagination,
                  showSizeChanger: false,
                  size: 'small',
                  onChange: handleInboundPageChange,
                  showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`
                }}
                scroll={{ y: 200 }}
                columns={[
                  { title: t('payable.inboundDate'), dataIndex: 'inbound_date', width: 100 },
                  { title: t('payable.productModel'), dataIndex: 'product_model', width: 120 },
                  { title: t('payable.quantity'), dataIndex: 'quantity', width: 80, align: 'right' },
                  { title: t('payable.unitPrice'), dataIndex: 'unit_price', width: 100, align: 'right', render: (value) => formatCurrency(value) },
                  { title: t('payable.totalPrice'), dataIndex: 'total_price', width: 100, align: 'right', render: (value) => formatCurrency(value) },
                  { title: t('payable.orderNumber'), dataIndex: 'order_number', width: 120, ellipsis: true },
                  { title: t('payable.remark'), dataIndex: 'remark', ellipsis: true },
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
