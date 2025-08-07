import React, { useState, useEffect, useCallback } from 'react';
import { Button, Form, message, Card, Typography, Row, Col, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import OutboundFilter from './components/OutboundFilter';
import OutboundTable from './components/OutboundTable';
import OutboundModal from './components/OutboundModal';
import { useTranslation } from 'react-i18next';
const { Title } = Typography;

const Outbound = () => {
  const [outboundRecords, setOutboundRecords] = useState([]);
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filters, setFilters] = useState({
    customer_short_name: undefined,
    product_model: undefined,
    dateRange: [],
  });
  const { t } = useTranslation();
  const [sorter, setSorter] = useState({
    field: undefined,
    order: undefined,
  });
  const [manualPrice, setManualPrice] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 获取出库记录列表
  const fetchOutboundRecords = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const page = params.page !== undefined ? params.page : pagination.current;
      const query = new URLSearchParams({
        ...params,
        page,
        customer_short_name: params.customer_short_name !== undefined ? params.customer_short_name : (filters.customer_short_name || ''),
        product_model: params.product_model !== undefined ? params.product_model : (filters.product_model || ''),
        start_date: params.start_date !== undefined ? params.start_date : (filters.dateRange[0] ? filters.dateRange[0] : ''),
        end_date: params.end_date !== undefined ? params.end_date : (filters.dateRange[1] ? filters.dateRange[1] : ''),
        sort_field: params.sort_field !== undefined ? params.sort_field : (sorter.field || ''),
        sort_order: params.sort_order !== undefined ? params.sort_order : (sorter.order || ''),
      });
      const response = await fetch(`/api/outbound?${query.toString()}`);
      if (response.ok) {
        const result = await response.json();
        console.log('[Outbound] fetch result:', result);
        setOutboundRecords(Array.isArray(result.data) ? result.data : []);
        setPagination({
          current: result.pagination.page,
          pageSize: result.pagination.limit,
          total: result.pagination.total,
        });
      } else {
        setOutboundRecords([]);
      }
    } catch {
      setOutboundRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters, sorter, pagination.current]);

  // 获取客户列表
  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners');
      if (response.ok) {
        const result = await response.json();
        const partnersArray = Array.isArray(result.data) ? result.data : [];
        setPartners(partnersArray.filter(partner => partner.type === 1)); // 只获取客户
      } else {
        console.error(t('outbound.fetchPartnersFailed'));
        setPartners([]);
      }
    } catch (error) {
      console.error(t('outbound.fetchPartnersFailed'), error);
      setPartners([]);
    }
  };

  // 获取产品列表
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const result = await response.json();
        setProducts(Array.isArray(result.data) ? result.data : []);
      } else {
        console.error(t('outbound.fetchProductsFailed'));
        setProducts([]);
      }
    } catch (error) {
      console.error(t('outbound.fetchProductsFailed'), error);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchOutboundRecords();
    fetchPartners();
    fetchProducts();
  }, [fetchOutboundRecords]);

  // 新增出库记录
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      outbound_date: dayjs(),
    });
    setModalVisible(true);
  };

  // 编辑出库记录
  const handleEdit = (record) => {
    setEditingRecord(record);
    const customer = partners.find(p => p.short_name === record.customer_short_name);
    const product = products.find(p => p.product_model === record.product_model);
    
    form.setFieldsValue({
      ...record,
      customer_code: customer?.code || '',
      product_code: product?.code || '',
      outbound_date: record.outbound_date ? dayjs(record.outbound_date) : null,
      invoice_date: record.invoice_date ? dayjs(record.invoice_date) : null,
    });
    setModalVisible(true);
  };

  // 删除出库记录
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/outbound/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        message.success(t('outbound.deleteSuccess'));
        fetchOutboundRecords();
      } else {
        message.error(t('outbound.deleteFailed'));
      }
    } catch {
      message.error(t('outbound.deleteFailed'));
    }
  };

  // 保存出库记录
  const handleSave = async (values) => {
    try {
      const customerCode = values.customer_code;
      const customerShortName = values.customer_short_name;
      const productCode = values.product_code;
      const productModel = values.product_model;

      if (customerCode && customerShortName) {
        const customer = partners.find(p => p.code === customerCode);
        if (!customer || customer.short_name !== customerShortName) {
          message.error(t('outbound.customerCodeShortNameMismatch'));
          return;
        }
      }

      if (productCode && productModel) {
        const product = products.find(p => p.code === productCode);
        if (!product || product.product_model !== productModel) {
          message.error(t('outbound.productCodeModelMismatch'));
          return;
        }
      }

      const formattedValues = {
        ...values,
        outbound_date: values.outbound_date ? values.outbound_date.format('YYYY-MM-DD') : null,
        invoice_date: values.invoice_date ? values.invoice_date.format('YYYY-MM-DD') : null,
        total_price: (values.quantity || 0) * (values.unit_price || 0),
      };

      const url = editingRecord 
        ? `/api/outbound/${editingRecord.id}`
        : '/api/outbound';
      const method = editingRecord ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });
      if (response.ok) {
        message.success(editingRecord ? t('outbound.editSuccess') : t('outbound.addSuccess'));
        setModalVisible(false);
        fetchOutboundRecords();
      } else {
        const errorData = await response.json();
        message.error(errorData.error || t('outbound.saveFailed'));
      }
    } catch {
      message.error(t('outbound.saveFailed'));
    }
  };

  // 处理客户代号输入，自动补全简称
  const handleCustomerCodeChange = (value) => {
    const customer = partners.find(p => p.code === value);
    if (customer) {
      form.setFieldsValue({
        customer_short_name: customer.short_name,
        customer_full_name: customer.full_name
      });
    }
    handlePartnerOrProductChange();
  };

  // 处理客户简称输入，自动补全代号
  const handleCustomerShortNameChange = (value) => {
    const customer = partners.find(p => p.short_name === value);
    if (customer) {
      form.setFieldsValue({
        customer_code: customer.code,
        customer_full_name: customer.full_name
      });
    }
    handlePartnerOrProductChange();
  };

  // 处理产品代号输入，自动补全型号
  const handleProductCodeChange = (value) => {
    const product = products.find(p => p.code === value);
    if (product) {
      form.setFieldsValue({
        product_model: product.product_model,
        product_category: product.category
      });
    }
    handlePartnerOrProductChange();
  };

  // 处理产品型号输入，自动补全代号
  const handleProductModelChange = (value) => {
    const product = products.find(p => p.product_model === value);
    if (product) {
      form.setFieldsValue({
        product_code: product.code,
        product_category: product.category
      });
    }
    handlePartnerOrProductChange();
  };

  // 处理客户或产品变化，自动获取价格
  const handlePartnerOrProductChange = async () => {
    if (!manualPrice) {
      const customerShortName = form.getFieldValue('customer_short_name');
      const productModel = form.getFieldValue('product_model');
      const outboundDate = form.getFieldValue('outbound_date');
      if (customerShortName && productModel && outboundDate) {
        const resp = await fetch(`/api/product-prices/auto?partner_short_name=${customerShortName}&product_model=${productModel}&date=${outboundDate.format('YYYY-MM-DD')}`);
        if (resp.ok) {
          const data = await resp.json();
          form.setFieldsValue({ unit_price: data.unit_price });
          handlePriceOrQuantityChange();
        } else {
          form.setFieldsValue({ unit_price: 0 });
          message.warning(t('outbound.autoPriceFailed'));
        }
      }
    }
  };

  // 处理价格或数量变化，自动计算总价
  const handlePriceOrQuantityChange = () => {
    const quantity = form.getFieldValue('quantity') || 0;
    const unitPrice = form.getFieldValue('unit_price') || 0;
    
    const totalPrice = quantity * unitPrice;

    form.setFieldsValue({
      total_price: totalPrice,
    });
  };

  // 筛选区表单提交
  const handleFilter = () => {
    // 重置分页到第1页
    setPagination(prev => ({
      ...prev,
      current: 1,
    }));
    fetchOutboundRecords({
      page: 1, // 筛选时从第1页开始
      customer_short_name: filters.customer_short_name,
      product_model: filters.product_model,
      start_date: filters.dateRange[0],
      end_date: filters.dateRange[1],
    });
  };

  // 表格排序
  const handleTableChange = (paginationTable, filtersTable, sorterTable) => {
    let field = sorterTable.field;
    let order = sorterTable.order === 'ascend' ? 'asc' : sorterTable.order === 'descend' ? 'desc' : undefined;
    setSorter({ field, order });
    setPagination(prev => ({
      ...prev,
      current: paginationTable.current,
    }));
    fetchOutboundRecords({
      page: paginationTable.current,
      customer_short_name: filters.customer_short_name,
      product_model: filters.product_model,
      start_date: filters.dateRange[0],
      end_date: filters.dateRange[1],
      sort_field: field,
      sort_order: order,
    });
  };

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>{t('outbound.title')}</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              {t('outbound.addOutboundRecord')}
            </Button>
          </Col>
        </Row>
        
        <OutboundFilter
          filters={filters}
          setFilters={setFilters}
          partners={partners}
          products={products}
          onFilter={handleFilter}
        />
        
        <Divider />
        
        <OutboundTable
          outboundRecords={outboundRecords}
          loading={loading}
          partners={partners}
          products={products}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTableChange={handleTableChange}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showQuickJumper: true,
            showTotal: (total, range) => t('outbound.paginationTotal', { start: range[0], end: range[1], total }),
          }}
        />
        {console.log(t('outbound.consoleRender'), outboundRecords.length, pagination)}
      </Card>

      <OutboundModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        editingRecord={editingRecord}
        form={form}
        partners={partners}
        products={products}
        manualPrice={manualPrice}
        setManualPrice={setManualPrice}
        onSave={handleSave}
        onCustomerCodeChange={handleCustomerCodeChange}
        onCustomerShortNameChange={handleCustomerShortNameChange}
        onProductCodeChange={handleProductCodeChange}
        onProductModelChange={handleProductModelChange}
        onPartnerOrProductChange={handlePartnerOrProductChange}
        onPriceOrQuantityChange={handlePriceOrQuantityChange}
      />
    </div>
  );
};
export default Outbound;
