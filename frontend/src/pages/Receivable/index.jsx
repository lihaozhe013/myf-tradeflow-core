import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, message, Card, Typography, Row, Col, Divider } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ReceivableTable from './components/ReceivableTable';
import ReceivableModal from './components/ReceivableModal';

const { Title } = Typography;

const Receivable = () => {
  const { t } = useTranslation();
  const [receivableRecords, setReceivableRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    customer_short_name: undefined,
  });
  const [sorter, setSorter] = useState({
    field: 'balance',
    order: 'descend',
  });

  // 获取应收账款列表
  const fetchReceivableRecords = async (params = {}) => {
    try {
      setLoading(true);
      const currentPage = params.page || pagination.current;
      const pageSize = params.limit || pagination.pageSize;
      const customerName = params.customer_short_name !== undefined ? params.customer_short_name : filters.customer_short_name;
      const sortField = params.sort_field || sorter.field || 'balance';
      const sortOrder = params.sort_order || (sorter.order === 'ascend' ? 'asc' : 'desc');
      
      const query = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        customer_short_name: customerName || '',
        sort_field: sortField,
        sort_order: sortOrder,
      });
      
      const response = await fetch(`/api/receivable?${query.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setReceivableRecords(Array.isArray(result.data) ? result.data : []);
        setPagination(prev => ({
          ...prev,
          current: result.page || 1,
          total: result.total || 0,
        }));
      } else {
        const error = await response.json();
        message.error(t('receivable.fetchFailed', { msg: error.error || t('common.unknownError') }));
        setReceivableRecords([]);
      }
    } catch (error) {
      console.error('获取应收账款数据失败:', error);
      message.error(t('receivable.fetchFailedNetwork'));
      setReceivableRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取客户列表
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/partners?type=1');
      if (response.ok) {
        const result = await response.json();
        setCustomers(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error(t('receivable.fetchFailed', { msg: error?.message || '' }), error);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchReceivableRecords();
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 筛选和排序变化时重新获取数据
  useEffect(() => {
    if (filters.customer_short_name !== undefined || sorter.field || sorter.order) {
      fetchReceivableRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.customer_short_name, sorter.field, sorter.order]);

  // 处理筛选
  const handleFilter = (filterValues) => {
    setFilters(filterValues);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 处理排序
  const handleSort = (field, order) => {
    setSorter({ field, order });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 处理分页
  const handleTableChange = (paginationConfig, filters, sorter) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: 10, // 固定为10，不允许修改
    }));
    
    if (sorter && sorter.field) {
      handleSort(sorter.field, sorter.order);
    }
  };

  // 新增回款记录
  const handleAddPayment = (customerRecord) => {
    setSelectedCustomer(customerRecord);
    setEditingPayment(null);
    form.resetFields();
    form.setFieldsValue({
      customer_code: customerRecord.customer_code,
      pay_date: null,
      amount: null,
      pay_method: '',
      remark: '',
    });
    setModalVisible(true);
  };

  // 编辑回款记录
  const handleEditPayment = (paymentRecord, customerRecord) => {
    setSelectedCustomer(customerRecord);
    setEditingPayment(paymentRecord);
    form.setFieldsValue({
      ...paymentRecord,
      pay_date: paymentRecord.pay_date ? dayjs(paymentRecord.pay_date) : null,
    });
    setModalVisible(true);
  };

  // 保存回款记录
  const handleSavePayment = async (values) => {
    try {
      const payload = {
        ...values,
        pay_date: values.pay_date ? values.pay_date.format('YYYY-MM-DD') : null,
      };

      const url = editingPayment ? `/api/receivable/payments/${editingPayment.id}` : '/api/receivable/payments';
      const method = editingPayment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
      message.success(t('receivable.saveSuccess', { action: editingPayment ? t('common.edit') : t('common.add') }));
        setModalVisible(false);
        fetchReceivableRecords(); // 刷新数据
      } else {
        const error = await response.json();
        message.error(t('receivable.saveFailed'));
      }
    } catch (error) {
      console.error(t('receivable.saveFailed'), error);
      message.error(t('receivable.saveFailed'));
    }
  };

  // 删除回款记录
  const handleDeletePayment = async (paymentId) => {
    try {
      const response = await fetch(`/api/receivable/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success(t('receivable.deleteSuccess'));
        fetchReceivableRecords(); // 刷新数据
      } else {
        const error = await response.json();
        message.error(t('receivable.deleteFailed'));
      }
    } catch (error) {
      console.error(t('receivable.deleteFailed'), error);
      message.error(t('receivable.deleteFailed'));
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchReceivableRecords();
    message.success(t('receivable.dataRefreshed'));
  };

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>{t('receivable.title')}</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              style={{ marginRight: 8 }}
            >
              {t('receivable.refresh')}
            </Button>
          </Col>
        </Row>

        <Divider />

        <ReceivableTable
          data={receivableRecords}
          loading={loading}
          pagination={pagination}
          filters={filters}
          sorter={sorter}
          onFilter={handleFilter}
          onTableChange={handleTableChange}
          onAddPayment={handleAddPayment}
          onEditPayment={handleEditPayment}
          onDeletePayment={handleDeletePayment}
        />

        <ReceivableModal
          visible={modalVisible}
          editingPayment={editingPayment}
          selectedCustomer={selectedCustomer}
          customers={customers}
          form={form}
          onSave={handleSavePayment}
          onCancel={() => setModalVisible(false)}
        />
      </Card>
    </div>
  );
};

export default Receivable;
