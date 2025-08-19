import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  message,
  Popconfirm,
  Card,
  Typography,
  Row,
  Col,
  Divider,
  AutoComplete
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSimpleApi, useSimpleApiData } from '../hooks/useSimpleApi';

const { Title } = Typography;
const { Option } = Select;

const ProductPrices = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const { t } = useTranslation();

  // 搜索与分页状态
  const [filters, setFilters] = useState({
    partner_short_name: undefined,
    product_model: undefined,
    effective_date: undefined,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 使用简化API hooks
  const { post, put, request } = useSimpleApi();
  
  // 构建产品价格查询URL
  const buildProductPricesUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: pagination.current.toString(),
    });
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });
    
    return `/product-prices?${params}`;
  }, [filters, pagination.current, pagination.pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // 获取产品价格列表
  const { 
    data: productPricesResponse, 
    loading, 
    refetch: refreshProductPrices 
  } = useSimpleApiData(buildProductPricesUrl(), {
    data: [],
    pagination: { current: 1, pageSize: 10, total: 0 }
  });

  // 获取合作伙伴列表
  const { data: partnersResponse } = useSimpleApiData('/partners', { data: [] });
  
  // 获取产品列表  
  const { data: productsResponse } = useSimpleApiData('/products', { data: [] });

  const productPrices = productPricesResponse?.data || [];
  const partners = partnersResponse?.data || [];
  const products = productsResponse?.data || [];

  // 当产品价格响应更新时，更新分页信息
  useEffect(() => {
    if (productPricesResponse?.pagination) {
      setPagination(prev => ({
        ...prev,
        total: productPricesResponse.pagination.total
      }));
    }
  }, [productPricesResponse]);

  // 新增价格
  const handleAdd = () => {
    setEditingPrice(null);
    form.resetFields();
    // 设置默认生效日期为今天
    form.setFieldsValue({
      effective_date: dayjs(),
    });
    setModalVisible(true);
  };

  // 编辑价格
  const handleEdit = (record) => {
    setEditingPrice(record);
    form.setFieldsValue({
      ...record,
      effective_date: record.effective_date ? dayjs(record.effective_date) : null,
    });
    setModalVisible(true);
  };

  // 删除价格
  const handleDelete = async (id) => {
    try {
      await request(`/product-prices/${id}`, { method: 'DELETE' });
      message.success(t('productPrices.deleteSuccess'));
      refreshProductPrices();
    } catch {
      // 错误已经在useSimpleApi中处理
    }
  };

  // 保存价格
  const handleSave = async (values) => {
    try {
      const formattedValues = {
        ...values,
        effective_date: values.effective_date ? values.effective_date.format('YYYY-MM-DD') : null,
      };

      if (editingPrice) {
        await put(`/product-prices/${editingPrice.id}`, formattedValues);
        message.success(t('productPrices.editSuccess'));
      } else {
        await post('/product-prices', formattedValues);
        message.success(t('productPrices.addSuccess'));
      }
      setModalVisible(false);
      refreshProductPrices();
    } catch {
      // 错误已经在useSimpleApi中处理
    }
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('productPrices.partnerShortName'),
      dataIndex: 'partner_short_name',
      key: 'partner_short_name',
      width: 120,
    },
    {
      title: t('productPrices.productModel'),
      dataIndex: 'product_model',
      key: 'product_model',
      width: 150,
    },
    {
      title: t('productPrices.unitPrice'),
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (price) => `¥${price}`,
    },
    {
      title: t('productPrices.effectiveDate'),
      dataIndex: 'effective_date',
      key: 'effective_date',
      width: 120,
    },
    {
      title: t('productPrices.actions'),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('productPrices.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 新增：用于AutoComplete的options
  const partnerCodeOptions = partners.map(p => ({ value: p.code, label: `${p.code} - ${p.short_name}` }));
  const partnerShortNameOptions = partners.map(p => ({ value: p.short_name, label: `${p.short_name} - ${p.full_name}` }));
  const productCodeOptions = products.map(p => ({ value: p.code, label: `${p.code} - ${p.product_model}` }));
  const productModelOptions = products.map(p => ({ value: p.product_model, label: `${p.product_model} - ${p.category}` }));

  // 联动逻辑
  const handlePartnerCodeChange = (code) => {
    const partner = partners.find(p => p.code === code);
    if (partner) {
      form.setFieldsValue({
        partner_code: partner.code,
        partner_short_name: partner.short_name,
      });
    } else {
      form.setFieldsValue({ partner_short_name: undefined });
    }
  };
  const handlePartnerShortNameChange = (short_name) => {
    const partner = partners.find(p => p.short_name === short_name);
    if (partner) {
      form.setFieldsValue({
        partner_code: partner.code,
        partner_short_name: partner.short_name,
      });
    } else {
      form.setFieldsValue({ partner_code: undefined });
    }
  };
  const handleProductCodeChange = (code) => {
    const product = products.find(p => p.code === code);
    if (product) {
      form.setFieldsValue({
        product_code: product.code,
        product_model: product.product_model,
      });
    } else {
      form.setFieldsValue({ product_model: undefined });
    }
  };
  const handleProductModelChange = (model) => {
    const product = products.find(p => p.product_model === model);
    if (product) {
      form.setFieldsValue({
        product_code: product.code,
        product_model: product.product_model,
      });
    } else {
      form.setFieldsValue({ product_code: undefined });
    }
  };

  // 过滤提交
  const handleFilter = () => {
    const values = filterForm.getFieldsValue();
    const nextFilters = {
      partner_short_name: values.partner_short_name,
      product_model: values.product_model,
      effective_date: values.effective_date ? values.effective_date.format('YYYY-MM-DD') : undefined,
    };
    setFilters(nextFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 表格分页变化
  const handleTableChange = (paginationTable) => {
    setPagination(prev => ({ ...prev, current: paginationTable.current }));
  };

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>{t('productPrices.title')}</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              {t('productPrices.addPrice')}
            </Button>
          </Col>
        </Row>

        {/* 筛选区 */}
        <Form form={filterForm} layout="inline" style={{ marginBottom: 12 }}>
          <Form.Item name="partner_short_name" label={t('productPrices.partnerShortName')} style={{ minWidth: 260 }}>
            <Select
              allowClear
              showSearch
              placeholder={t('productPrices.selectPartner')}
              options={partnerShortNameOptions}
              filterOption={(input, option) => (option?.label || '').toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
          <Form.Item name="product_model" label={t('productPrices.productModel')} style={{ minWidth: 260 }}>
            <Select
              allowClear
              showSearch
              placeholder={t('productPrices.selectProductModel')}
              options={productModelOptions}
              filterOption={(input, option) => (option?.label || '').toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
          <Form.Item name="effective_date" label={t('productPrices.effectiveDate')}>
            <DatePicker allowClear format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleFilter}>{t('common.search') || 'Search'}</Button>
          </Form.Item>
        </Form>

        <Divider />

        <div className="responsive-table">
          <Table
            columns={columns}
            dataSource={productPrices}
            rowKey="id"
            loading={loading}
            onChange={handleTableChange}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showQuickJumper: true,
              showTotal: (total, range) =>
                t('productPrices.paginationTotal', { start: range[0], end: range[1], total }),
            }}
            scroll={{ x: 800 }}
          />
        </div>
      </Card>

      <Modal
        title={editingPrice ? t('productPrices.editPrice') : t('productPrices.addPrice')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item label={t('productPrices.partnerCode')} name="partner_code">
                <AutoComplete
                  options={partnerCodeOptions}
                  placeholder={t('productPrices.inputPartnerCode')}
                  onChange={handlePartnerCodeChange}
                  filterOption={(inputValue, option) =>
                    option.value.toLowerCase().includes(inputValue.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('productPrices.partnerShortName')}
                name="partner_short_name"
                rules={[{ required: true, message: t('productPrices.selectPartner') }]}
              >
                <Select
                  placeholder={t('productPrices.selectPartner')}
                  showSearch
                  options={partnerShortNameOptions}
                  onChange={handlePartnerShortNameChange}
                  filterOption={(input, option) =>
                    option.value.toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item label={t('productPrices.productCode')} name="product_code">
                <AutoComplete
                  options={productCodeOptions}
                  placeholder={t('productPrices.inputProductCode')}
                  onChange={handleProductCodeChange}
                  filterOption={(inputValue, option) =>
                    option.value.toLowerCase().includes(inputValue.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('productPrices.productModel')}
                name="product_model"
                rules={[{ required: true, message: t('productPrices.selectProductModel') }]}
              >
                <Select
                  placeholder={t('productPrices.selectProductModel')}
                  showSearch
                  options={productModelOptions}
                  onChange={handleProductModelChange}
                  filterOption={(input, option) =>
                    option.value.toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={t('productPrices.unitPrice')}
            name="unit_price"
            rules={[
              { required: true, message: t('productPrices.inputUnitPrice') },
              { type: 'number', min: 0, message: t('productPrices.unitPriceMin') },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder={t('productPrices.inputUnitPrice')}
              precision={4}
              min={0}
              addonBefore="¥"
            />
          </Form.Item>

          <Form.Item
            label={t('productPrices.effectiveDate')}
            name="effective_date"
            rules={[{ required: true, message: t('productPrices.selectEffectiveDate') }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder={t('productPrices.selectEffectiveDate')}
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <div className="form-actions">
            <Button onClick={() => setModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="primary" htmlType="submit">
              {editingPrice ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductPrices;
