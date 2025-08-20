import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, message, Card, Typography, Row, Col, Divider } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSimpleApi, useSimpleApiData } from '../../hooks/useSimpleApi';
import ReceivableTable from './components/ReceivableTable';
import ReceivableModal from './components/ReceivableModal';

const { Title } = Typography;

const Receivable = () => {
  const { t } = useTranslation();
  const [receivableRecords, setReceivableRecords] = useState([]);
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

  // 使用认证API获取数据
  const apiInstance = useSimpleApi();
  const { data: customersResponse } = useSimpleApiData('/partners?type=1', { data: [] });
  
  // 提取 data 字段
  const customers = customersResponse?.data || [];
  
  // 提取稳定的依赖值
  const customerShortName = filters.customer_short_name;
  const sortField = sorter.field;
  const sortOrder = sorter.order;

  // 获取应收账款列表
  const fetchReceivableRecords = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      
      // 使用稳定的参数或传入的参数
      const page = params.page !== undefined ? params.page : pagination.current;
      const limit = params.limit || pagination.pageSize;
      const customerName = params.customer_short_name !== undefined ? params.customer_short_name : customerShortName;
      const field = params.sort_field || sortField || 'balance';
      const order = params.sort_order || (sortOrder === 'ascend' ? 'asc' : 'desc');
      
      const query = new URLSearchParams({
        page,
        limit,
        customer_short_name: customerName || '',
        sort_field: field,
        sort_order: order,
      });
      
      const result = await apiInstance.get(`/receivable?${query.toString()}`);
      setReceivableRecords(Array.isArray(result.data) ? result.data : []);
      setPagination(prev => ({
        ...prev,
        current: result.page || 1,
        total: result.total || 0,
      }));
    } catch (error) {
      console.error('获取应收账款数据失败:', error);
      message.error(t('receivable.fetchFailedNetwork'));
      setReceivableRecords([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerShortName, sortField, sortOrder]);

  // 页面加载时获取数据
  useEffect(() => {
    fetchReceivableRecords({ page: 1 });
  }, [fetchReceivableRecords]);

  // 筛选和排序变化时重新获取数据
  useEffect(() => {
    if (customerShortName !== undefined || sortField || sortOrder) {
      fetchReceivableRecords({ page: 1 });
    }
  }, [customerShortName, sortField, sortOrder, fetchReceivableRecords]);

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

      if (editingPayment) {
        await apiInstance.put(`/receivable/payments/${editingPayment.id}`, payload);
      } else {
        await apiInstance.post('/receivable/payments', payload);
      }

      message.success(t('receivable.saveSuccess', { action: editingPayment ? t('common.edit') : t('common.add') }));
      setModalVisible(false);
      fetchReceivableRecords(); // 刷新数据
    } catch (error) {
      console.error(t('receivable.saveFailed'), error);
      message.error(t('receivable.saveFailed'));
    }
  };

  // 删除回款记录
  const handleDeletePayment = async (paymentId) => {
    try {
      await apiInstance.delete(`/receivable/payments/${paymentId}`);
      message.success(t('receivable.deleteSuccess'));
      fetchReceivableRecords(); // 刷新数据
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
          apiInstance={apiInstance}
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
