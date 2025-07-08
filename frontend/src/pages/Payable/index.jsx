import React, { useState, useEffect } from 'react';
import { Button, Form, message, Card, Typography, Row, Col, Divider } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PayableTable from './components/PayableTable';
import PayableModal from './components/PayableModal';

const { Title } = Typography;

const Payable = () => {
  const [payableRecords, setPayableRecords] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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

  // 获取应付账款列表
  const fetchPayableRecords = async (params = {}) => {
    try {
      setLoading(true);
      const currentPage = params.page || pagination.current;
      const pageSize = params.limit || pagination.pageSize;
      const supplierName = params.supplier_short_name !== undefined ? params.supplier_short_name : filters.supplier_short_name;
      const sortField = params.sort_field || sorter.field || 'balance';
      const sortOrder = params.sort_order || (sorter.order === 'ascend' ? 'asc' : 'desc');
      
      const query = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        supplier_short_name: supplierName || '',
        sort_field: sortField,
        sort_order: sortOrder,
      });
      
      const response = await fetch(`/api/payable?${query.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setPayableRecords(Array.isArray(result.data) ? result.data : []);
        setPagination(prev => ({
          ...prev,
          current: result.page || 1,
          total: result.total || 0,
        }));
      } else {
        const error = await response.json();
        message.error(`获取应付账款数据失败: ${error.error || '未知错误'}`);
        setPayableRecords([]);
      }
    } catch (error) {
      console.error('获取应付账款数据失败:', error);
      message.error('获取应付账款数据失败，请检查网络连接');
      setPayableRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取供应商列表
  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/partners?type=0');
      if (response.ok) {
        const result = await response.json();
        setSuppliers(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error('获取供应商列表失败:', error);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchPayableRecords();
    fetchSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 筛选和排序变化时重新获取数据
  useEffect(() => {
    if (filters.supplier_short_name !== undefined || sorter.field || sorter.order) {
      fetchPayableRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.supplier_short_name, sorter.field, sorter.order]);

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
      pageSize: paginationConfig.pageSize,
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

      const url = editingPayment ? `/api/payable/payments/${editingPayment.id}` : '/api/payable/payments';
      const method = editingPayment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        message.success(`付款记录${editingPayment ? '更新' : '创建'}成功`);
        setModalVisible(false);
        fetchPayableRecords(); // 刷新数据
      } else {
        const error = await response.json();
        message.error(`操作失败: ${error.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('保存付款记录失败:', error);
      message.error('保存失败，请检查网络连接');
    }
  };

  // 删除付款记录
  const handleDeletePayment = async (paymentId) => {
    try {
      const response = await fetch(`/api/payable/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('付款记录删除成功');
        fetchPayableRecords(); // 刷新数据
      } else {
        const error = await response.json();
        message.error(`删除失败: ${error.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('删除付款记录失败:', error);
      message.error('删除失败，请检查网络连接');
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchPayableRecords();
    message.success('数据已刷新');
  };

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>应付账款管理</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              style={{ marginRight: 8 }}
            >
              刷新
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
