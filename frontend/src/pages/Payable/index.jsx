import React, { useState, useEffect, useCallback } from 'react';
import { Button, Form, message, Card, Typography, Row, Col, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSimpleApi, useSimpleApiData } from '../../hooks/useSimpleApi';
import PayableTable from './components/PayableTable';
import PayableModal from './components/PayableModal';

const { Title } = Typography;

const Payable = () => {
  const [payableRecords, setPayableRecords] = useState([]);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    supplier_short_name: undefined,
  });
  const [sorter, setSorter] = useState({
    field: 'balance',
    order: 'descend',
  });

  // 使用认证API获取数据
  const apiInstance = useSimpleApi();
  const { data: suppliersResponse } = useSimpleApiData('/partners?type=0', { data: [] });
  
  // 提取 data 字段
  const suppliers = suppliersResponse?.data || [];

  // 提取稳定的依赖值
  const supplierShortName = filters.supplier_short_name;
  const sortField = sorter.field;
  const sortOrder = sorter.order;

  // 获取应付账款列表
  const fetchPayableRecords = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const page = params.page !== undefined ? params.page : pagination.current;
      const limit = params.limit || pagination.pageSize;
      const supplierName = params.supplier_short_name !== undefined ? params.supplier_short_name : supplierShortName;
      const field = params.sort_field || sortField || 'balance';
      const order = params.sort_order || (sortOrder === 'ascend' ? 'asc' : 'desc');
      
      const query = new URLSearchParams({
        page,
        limit,
        supplier_short_name: supplierName || '',
        sort_field: field,
        sort_order: order,
      });
      
      const result = await apiInstance.get(`/payable?${query.toString()}`);
      setPayableRecords(Array.isArray(result.data) ? result.data : []);
      setPagination(prev => ({
        ...prev,
        current: result.page || 1,
        total: result.total || 0,
      }));
    } catch (error) {
      console.error('获取应付账款数据失败:', error);
      message.error(t('payable.fetchFailedNetwork'));
      setPayableRecords([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierShortName, sortField, sortOrder]);

  // 页面加载时获取数据
  useEffect(() => {
    fetchPayableRecords({ page: 1 });
  }, [fetchPayableRecords]);

  // 筛选和排序变化时重新获取数据
  useEffect(() => {
    if (supplierShortName !== undefined || sortField || sortOrder) {
      fetchPayableRecords({ page: 1 });
    }
  }, [supplierShortName, sortField, sortOrder, fetchPayableRecords]);

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

  // 新增付款记录
  const handleAddPayment = (supplierRecord) => {
    setSelectedSupplier(supplierRecord);
    setEditingPayment(null);
    form.resetFields();
    form.setFieldsValue({
      supplier_code: supplierRecord.supplier_code,
      pay_date: null,
      amount: null,
      pay_method: '',
      remark: '',
    });
    setModalVisible(true);
  };

  // 编辑付款记录
  const handleEditPayment = (paymentRecord, supplierRecord) => {
    setSelectedSupplier(supplierRecord);
    setEditingPayment(paymentRecord);
    form.setFieldsValue({
      ...paymentRecord,
      pay_date: paymentRecord.pay_date ? dayjs(paymentRecord.pay_date) : null,
    });
    setModalVisible(true);
  };

  // 保存付款记录
  const handleSavePayment = async (values) => {
    try {
      const payload = {
        ...values,
        pay_date: values.pay_date ? values.pay_date.format('YYYY-MM-DD') : null,
      };

      if (editingPayment) {
        await apiInstance.put(`/payable/payments/${editingPayment.id}`, payload);
      } else {
        await apiInstance.post('/payable/payments', payload);
      }

      message.success(t('payable.saveSuccess', { action: editingPayment ? t('payable.editPayment') : t('payable.addPayment') }));
      setModalVisible(false);
      fetchPayableRecords(); // 刷新数据
    } catch (error) {
      console.error('保存付款记录失败:', error);
      message.error(t('payable.saveFailed'));
    }
  };

  // 删除付款记录
  const handleDeletePayment = async (paymentId) => {
    try {
      await apiInstance.delete(`/payable/payments/${paymentId}`);
      message.success(t('payable.deleteSuccess'));
      fetchPayableRecords(); // 刷新数据
    } catch (error) {
      console.error('删除付款记录失败:', error);
      message.error(t('payable.deleteFailed'));
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchPayableRecords();
    message.success(t('payable.dataRefreshed'));
  };

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>{t('payable.title')}</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              style={{ marginRight: 8 }}
            >
              {t('payable.refresh')}
            </Button>
          </Col>
        </Row>

        <Divider />

        <PayableTable
          data={payableRecords}
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

        <PayableModal
          visible={modalVisible}
          editingPayment={editingPayment}
          selectedSupplier={selectedSupplier}
          suppliers={suppliers}
          form={form}
          onSave={handleSavePayment}
          onCancel={() => setModalVisible(false)}
        />
      </Card>
    </div>
  );
};

export default Payable;
