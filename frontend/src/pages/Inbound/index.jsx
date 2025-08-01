import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, message, Card, Typography, Row, Col, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import InboundFilter from './components/InboundFilter';
import InboundTable from './components/InboundTable';
import InboundModal from './components/InboundModal';

const { Title } = Typography;

const Inbound = () => {
  const { t } = useTranslation();
  const [inboundRecords, setInboundRecords] = useState([]);
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filters, setFilters] = useState({
    supplier_short_name: undefined,
    product_model: undefined,
    dateRange: [],
  });
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

  // 获取入库记录列表
  const fetchInboundRecords = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const page = params.page !== undefined ? params.page : pagination.current;
      const query = new URLSearchParams({
        ...params,
        page,
        // limit参数不传，后端已定死10
        supplier_short_name: params.supplier_short_name !== undefined ? params.supplier_short_name : (filters.supplier_short_name || ''),
        product_model: params.product_model !== undefined ? params.product_model : (filters.product_model || ''),
        start_date: params.start_date !== undefined ? params.start_date : (filters.dateRange[0] ? filters.dateRange[0] : ''),
        end_date: params.end_date !== undefined ? params.end_date : (filters.dateRange[1] ? filters.dateRange[1] : ''),
        sort_field: params.sort_field !== undefined ? params.sort_field : (sorter.field || ''),
        sort_order: params.sort_order !== undefined ? params.sort_order : (sorter.order || ''),
      });
      const response = await fetch(`/api/inbound?${query.toString()}`);
      if (response.ok) {
        const result = await response.json();
        console.log('[Inbound] fetch result:', result);
        setInboundRecords(Array.isArray(result.data) ? result.data : []);
        setPagination({
          current: result.pagination.page,
          pageSize: result.pagination.limit,
          total: result.pagination.total,
        });
      } else {
        setInboundRecords([]);
      }
    } catch {
      setInboundRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters, sorter, pagination.current]);

  // 获取供应商列表
  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners');
      if (response.ok) {
        const result = await response.json();
        const partnersArray = Array.isArray(result.data) ? result.data : [];
        setPartners(partnersArray.filter(partner => partner.type === 0));
      } else {
        console.error('获取供应商列表失败');
        setPartners([]);
      }
    } catch (error) {
      console.error('获取供应商列表失败:', error);
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
        console.error('获取产品列表失败');
        setProducts([]);
      }
    } catch (error) {
      console.error('获取产品列表失败:', error);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchInboundRecords();
    fetchPartners();
    fetchProducts();
  }, [fetchInboundRecords]);

  // 新增入库记录
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      inbound_date: dayjs(),
    });
    setModalVisible(true);
  };

  // 编辑入库记录
  const handleEdit = (record) => {
    setEditingRecord(record);
    const supplier = partners.find(p => p.short_name === record.supplier_short_name);
    const product = products.find(p => p.product_model === record.product_model);
    
    form.setFieldsValue({
      ...record,
      supplier_code: supplier?.code || '',
      product_code: product?.code || '',
      inbound_date: record.inbound_date ? dayjs(record.inbound_date) : null,
      invoice_date: record.invoice_date ? dayjs(record.invoice_date) : null,
    });
    setModalVisible(true);
  };

  // 删除入库记录
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/inbound/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        message.success('删除成功');
        fetchInboundRecords();
      } else {
        message.error('删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  };

  // 保存入库记录
  const handleSave = async (values) => {
    try {
      const supplierCode = values.supplier_code;
      const supplierShortName = values.supplier_short_name;
      const productCode = values.product_code;
      const productModel = values.product_model;

      if (supplierCode && supplierShortName) {
        const supplier = partners.find(p => p.code === supplierCode);
        if (!supplier || supplier.short_name !== supplierShortName) {
          message.error('供应商代号与简称不匹配，请重新选择');
          return;
        }
      }

      if (productCode && productModel) {
        const product = products.find(p => p.code === productCode);
        if (!product || product.product_model !== productModel) {
          message.error('产品代号与型号不匹配，请重新选择');
          return;
        }
      }

      const formattedValues = {
        ...values,
        inbound_date: values.inbound_date ? values.inbound_date.format('YYYY-MM-DD') : null,
        invoice_date: values.invoice_date ? values.invoice_date.format('YYYY-MM-DD') : null,
        total_price: (values.quantity || 0) * (values.unit_price || 0),
      };

      const url = editingRecord 
        ? `/api/inbound/${editingRecord.id}`
        : '/api/inbound';
      const method = editingRecord ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });
      if (response.ok) {
        message.success(editingRecord ? '修改成功' : '新增成功');
        setModalVisible(false);
        fetchInboundRecords();
      } else {
        const errorData = await response.json();
        message.error(errorData.error || '保存失败');
      }
    } catch {
      message.error('保存失败');
    }
  };

  // 处理供应商代号输入，自动补全简称
  const handleSupplierCodeChange = (value) => {
    const supplier = partners.find(p => p.code === value);
    if (supplier) {
      form.setFieldsValue({
        supplier_short_name: supplier.short_name,
        supplier_full_name: supplier.full_name
      });
    }
    handlePartnerOrProductChange();
  };

  // 处理供应商简称输入，自动补全代号
  const handleSupplierShortNameChange = (value) => {
    const supplier = partners.find(p => p.short_name === value);
    if (supplier) {
      form.setFieldsValue({
        supplier_code: supplier.code,
        supplier_full_name: supplier.full_name
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

  // 处理供应商或产品变化，自动获取价格
  const handlePartnerOrProductChange = async () => {
    if (!manualPrice) {
      const supplierShortName = form.getFieldValue('supplier_short_name');
      const productModel = form.getFieldValue('product_model');
      const inboundDate = form.getFieldValue('inbound_date');
      if (supplierShortName && productModel && inboundDate) {
        const resp = await fetch(`/api/product-prices/auto?partner_short_name=${supplierShortName}&product_model=${productModel}&date=${inboundDate.format('YYYY-MM-DD')}`);
        if (resp.ok) {
          const data = await resp.json();
          form.setFieldsValue({ unit_price: data.unit_price });
          handlePriceOrQuantityChange();
        } else {
          form.setFieldsValue({ unit_price: 0 });
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
    fetchInboundRecords({
      page: 1, // 筛选时从第1页开始
      supplier_short_name: filters.supplier_short_name,
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
    fetchInboundRecords({
      page: paginationTable.current,
      supplier_short_name: filters.supplier_short_name,
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
            <Title level={3} style={{ margin: 0 }}>{t('nav.inbound')}</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              {t('inbound.addInboundRecord')}
            </Button>
          </Col>
        </Row>
        
        <InboundFilter
          filters={filters}
          setFilters={setFilters}
          partners={partners}
          products={products}
          onFilter={handleFilter}
        />
        
        <Divider />
        
        <InboundTable
          inboundRecords={inboundRecords}
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
        {console.log('[Inbound] render: records.length', inboundRecords.length, 'pagination', pagination)}
      </Card>

      <InboundModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        editingRecord={editingRecord}
        form={form}
        partners={partners}
        products={products}
        manualPrice={manualPrice}
        setManualPrice={setManualPrice}
        onSave={handleSave}
        onSupplierCodeChange={handleSupplierCodeChange}
        onSupplierShortNameChange={handleSupplierShortNameChange}
        onProductCodeChange={handleProductCodeChange}
        onProductModelChange={handleProductModelChange}
        onPartnerOrProductChange={handlePartnerOrProductChange}
        onPriceOrQuantityChange={handlePriceOrQuantityChange}
      />
    </div>
  );
};

export default Inbound;
