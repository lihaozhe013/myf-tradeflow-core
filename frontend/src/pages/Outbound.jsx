import React, { useState, useEffect } from 'react';
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
  Tag,
  AutoComplete
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

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
  const [sorter, setSorter] = useState({
    field: undefined,
    order: undefined,
  });

  // 获取出库记录列表
  const fetchOutboundRecords = async (params = {}) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        ...params,
        customer_short_name: params.customer_short_name || filters.customer_short_name || '',
        product_model: params.product_model || filters.product_model || '',
        start_date: params.start_date || (filters.dateRange[0] ? filters.dateRange[0] : ''),
        end_date: params.end_date || (filters.dateRange[1] ? filters.dateRange[1] : ''),
        sort_field: params.sort_field || sorter.field || '',
        sort_order: params.sort_order || sorter.order || '',
      });
      const response = await fetch(`/api/outbound?${query.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setOutboundRecords(Array.isArray(result.data) ? result.data : []);
      } else {
        setOutboundRecords([]);
      }
    } catch (error) {
      setOutboundRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取客户列表
  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners');
      if (response.ok) {
        const result = await response.json();
        // API返回格式为 {data: [...]}
        const partnersArray = Array.isArray(result.data) ? result.data : [];
        setPartners(partnersArray.filter(partner => partner.type === 1)); // 只获取客户
      } else {
        console.error('获取客户列表失败');
        setPartners([]);
      }
    } catch (error) {
      console.error('获取客户列表失败:', error);
      setPartners([]);
    }
  };

  // 获取产品列表
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const result = await response.json();
        // API返回格式为 {data: [...]}
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

  // 获取当前有效价格
  const fetchCurrentPrice = async (partnerShortName, productModel, date) => {
    try {
      const response = await fetch(`/api/product-prices/current?partner_short_name=${partnerShortName}&product_model=${productModel}&date=${date}`);
      if (response.ok) {
        const data = await response.json();
        return data.unit_price || 0;
      }
    } catch (error) {
      console.error('获取价格失败:', error);
    }
    return 0;
  };

  useEffect(() => {
    fetchOutboundRecords();
    fetchPartners();
    fetchProducts();
  }, []);

  // 新增出库记录
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    // 设置默认出库日期为今天
    form.setFieldsValue({
      outbound_date: dayjs(),
    });
    setModalVisible(true);
  };

  // 编辑出库记录
  const handleEdit = (record) => {
    setEditingRecord(record);
    // 需要根据简称和型号找到对应的代号
    const customer = partners.find(p => p.short_name === record.customer_short_name);
    const product = products.find(p => p.product_model === record.product_model);
    
    form.setFieldsValue({
      ...record,
      customer_code: customer?.code || '',
      product_code: product?.code || '',
      outbound_date: record.outbound_date ? dayjs(record.outbound_date) : null,
      invoice_date: record.invoice_date ? dayjs(record.invoice_date) : null,
      collection_date: record.collection_date ? dayjs(record.collection_date) : null,
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
        message.success('删除成功');
        fetchOutboundRecords();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 保存出库记录
  const handleSave = async (values) => {
    try {
      // 强绑定校验：检查代号和简称/型号是否匹配
      const customerCode = values.customer_code;
      const customerShortName = values.customer_short_name;
      const productCode = values.product_code;
      const productModel = values.product_model;

      if (customerCode && customerShortName) {
        const customer = partners.find(p => p.code === customerCode);
        if (!customer || customer.short_name !== customerShortName) {
          message.error('客户代号与简称不匹配，请重新选择');
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
        outbound_date: values.outbound_date ? values.outbound_date.format('YYYY-MM-DD') : null,
        invoice_date: values.invoice_date ? values.invoice_date.format('YYYY-MM-DD') : null,
        collection_date: values.collection_date ? values.collection_date.format('YYYY-MM-DD') : null,
        // 计算总价和应收金额
        total_price: (values.quantity || 0) * (values.unit_price || 0),
        receivable_amount: ((values.quantity || 0) * (values.unit_price || 0)) - (values.collection_amount || 0),
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
        message.success(editingRecord ? '修改成功' : '新增成功');
        setModalVisible(false);
        fetchOutboundRecords();
      } else {
        const errorData = await response.json();
        message.error(errorData.error || '保存失败');
      }
    } catch (error) {
      message.error('保存失败');
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
    const customerShortName = form.getFieldValue('customer_short_name');
    const productModel = form.getFieldValue('product_model');
    const outboundDate = form.getFieldValue('outbound_date');

    if (customerShortName && productModel && outboundDate) {
      const price = await fetchCurrentPrice(
        customerShortName,
        productModel,
        outboundDate.format('YYYY-MM-DD')
      );
      if (price > 0) {
        form.setFieldsValue({ unit_price: price });
        // 触发总价计算
        handlePriceOrQuantityChange();
      }
    }
  };

  // 处理价格或数量变化，自动计算总价和应收金额
  const handlePriceOrQuantityChange = () => {
    const quantity = form.getFieldValue('quantity') || 0;
    const unitPrice = form.getFieldValue('unit_price') || 0;
    const collectionAmount = form.getFieldValue('collection_amount') || 0;
    
    const totalPrice = quantity * unitPrice;
    const receivableAmount = totalPrice - collectionAmount;

    form.setFieldsValue({
      total_price: totalPrice,
      receivable_amount: receivableAmount,
    });
  };

  // 筛选区表单提交
  const handleFilter = () => {
    fetchOutboundRecords({
      customer_short_name: filters.customer_short_name,
      product_model: filters.product_model,
      start_date: filters.dateRange[0],
      end_date: filters.dateRange[1],
    });
  };

  // 表格排序
  const handleTableChange = (pagination, filtersTable, sorterTable) => {
    let field = sorterTable.field;
    let order = sorterTable.order === 'ascend' ? 'asc' : sorterTable.order === 'descend' ? 'desc' : undefined;
    setSorter({ field, order });
    fetchOutboundRecords({ sort_field: field, sort_order: order });
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
      title: '客户代号',
      dataIndex: 'customer_code',
      key: 'customer_code',
      width: 100,
    },
    {
      title: '客户简称',
      dataIndex: 'customer_short_name',
      key: 'customer_short_name',
      width: 120,
      filters: partners.map(p => ({ text: p.short_name, value: p.short_name })),
      onFilter: (value, record) => record.customer_short_name === value,
    },
    {
      title: '产品代号',
      dataIndex: 'product_code',
      key: 'product_code',
      width: 100,
    },
    {
      title: '产品型号',
      dataIndex: 'product_model',
      key: 'product_model',
      width: 150,
      filters: products.map(p => ({ text: p.product_model, value: p.product_model })),
      onFilter: (value, record) => record.product_model === value,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (price) => `¥${price}`,
      sorter: true,
    },
    {
      title: '总价',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 100,
      render: (price) => `¥${price}`,
      sorter: true,
    },
    {
      title: '出库日期',
      dataIndex: 'outbound_date',
      key: 'outbound_date',
      width: 120,
      sorter: true,
    },
    {
      title: '回款状态',
      key: 'collection_status',
      width: 100,
      render: (_, record) => {
        const receivableAmount = record.receivable_amount || 0;
        if (receivableAmount <= 0) {
          return <Tag color="green">已回款</Tag>;
        } else if (record.collection_amount > 0) {
          return <Tag color="orange">部分回款</Tag>;
        } else {
          return <Tag color="red">未回款</Tag>;
        }
      },
    },
    {
      title: '应收金额',
      dataIndex: 'receivable_amount',
      key: 'receivable_amount',
      width: 100,
      render: (amount) => `¥${amount || 0}`,
    },
    {
      title: '操作',
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
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条出库记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={5}>
            <Select
              allowClear
              showSearch
              placeholder="选择客户"
              style={{ width: '100%' }}
              value={filters.customer_short_name}
              onChange={v => setFilters(f => ({ ...f, customer_short_name: v }))}
              options={partners.map(p => ({ label: `${p.short_name}(${p.code})`, value: p.short_name }))}
              filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
            />
          </Col>
          <Col span={5}>
            <Select
              allowClear
              showSearch
              placeholder="选择产品型号"
              style={{ width: '100%' }}
              value={filters.product_model}
              onChange={v => setFilters(f => ({ ...f, product_model: v }))}
              options={products.map(p => ({ label: `${p.product_model}(${p.code})`, value: p.product_model }))}
              filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
            />
          </Col>
          <Col span={8}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange && filters.dateRange[0] ? [dayjs(filters.dateRange[0]), dayjs(filters.dateRange[1])] : []}
              onChange={dates => setFilters(f => ({ ...f, dateRange: dates ? [dates[0]?.format('YYYY-MM-DD'), dates[1]?.format('YYYY-MM-DD')] : [] }))}
              format="YYYY-MM-DD"
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col span={3}>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleFilter}>
              筛选
            </Button>
          </Col>
        </Row>
        <Divider />
        <div className="responsive-table">
          <Table
            columns={columns}
            dataSource={outboundRecords}
            rowKey="id"
            loading={loading}
            rowSelection={rowSelection}
            onChange={handleTableChange}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            }}
            scroll={{ x: 1200 }}
          />
        </div>
      </Card>

      <Modal
        title={editingRecord ? '编辑出库记录' : '新增出库记录'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="客户代号"
                name="customer_code"
                rules={[{ required: true, message: '请输入客户代号' }]}
              >
                <AutoComplete
                  placeholder="请输入客户代号"
                  onChange={handleCustomerCodeChange}
                  options={partners.map(partner => ({
                    value: partner.code,
                    label: `${partner.code} - ${partner.short_name}`
                  }))}
                  filterOption={(inputValue, option) =>
                    option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                    option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="客户简称"
                name="customer_short_name"
                rules={[{ required: true, message: '请输入客户简称' }]}
              >
                <AutoComplete
                  placeholder="请输入客户简称"
                  onChange={handleCustomerShortNameChange}
                  options={partners.map(partner => ({
                    value: partner.short_name,
                    label: `${partner.short_name} - ${partner.code}`
                  }))}
                  filterOption={(inputValue, option) =>
                    option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                    option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="客户全称"
                name="customer_full_name"
              >
                <Input placeholder="自动填充" disabled />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="产品代号"
                name="product_code"
                rules={[{ required: true, message: '请输入产品代号' }]}
              >
                <AutoComplete
                  placeholder="请输入产品代号"
                  onChange={handleProductCodeChange}
                  options={products.map(product => ({
                    value: product.code,
                    label: `${product.code} - ${product.product_model}`
                  }))}
                  filterOption={(inputValue, option) =>
                    option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                    option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="产品型号"
                name="product_model"
                rules={[{ required: true, message: '请输入产品型号' }]}
              >
                <AutoComplete
                  placeholder="请输入产品型号"
                  onChange={handleProductModelChange}
                  options={products.map(product => ({
                    value: product.product_model,
                    label: `${product.product_model} - ${product.code}`
                  }))}
                  filterOption={(inputValue, option) =>
                    option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                    option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="出库日期"
                name="outbound_date"
                rules={[{ required: true, message: '请选择出库日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择出库日期"
                  format="YYYY-MM-DD"
                  onChange={handlePartnerOrProductChange}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="数量"
                name="quantity"
                rules={[
                  { required: true, message: '请输入数量' },
                  { type: 'number', min: 1, message: '数量必须大于0' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入数量"
                  min={1}
                  onChange={handlePriceOrQuantityChange}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="单价"
                name="unit_price"
                rules={[
                  { required: true, message: '请输入单价' },
                  { type: 'number', min: 0, message: '单价必须大于等于0' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入单价"
                  precision={4}
                  min={0}
                  addonBefore="¥"
                  onChange={handlePriceOrQuantityChange}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="总价"
                name="total_price"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="自动计算"
                  precision={2}
                  disabled
                  addonBefore="¥"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="回款金额"
                name="collection_amount"
                rules={[{ type: 'number', min: 0, message: '回款金额必须大于等于0' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入回款金额"
                  precision={2}
                  min={0}
                  addonBefore="¥"
                  onChange={handlePriceOrQuantityChange}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="应收金额"
                name="receivable_amount"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="自动计算"
                  precision={2}
                  disabled
                  addonBefore="¥"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="回款日期"
                name="collection_date"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择回款日期"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="发票日期"
                name="invoice_date"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择发票日期"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="发票号码"
                name="invoice_number"
              >
                <Input placeholder="请输入发票号码" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="订单号"
                name="order_number"
              >
                <Input placeholder="请输入订单号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="回款方式"
                name="collection_method"
              >
                <Select placeholder="请选择回款方式">
                  <Option value="银行转账">银行转账</Option>
                  <Option value="现金">现金</Option>
                  <Option value="支票">支票</Option>
                  <Option value="微信支付">微信支付</Option>
                  <Option value="支付宝">支付宝</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="发票图片链接"
                name="invoice_image_url"
              >
                <Input placeholder="请输入发票图片链接" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="备注"
            name="remark"
          >
            <Input.TextArea
              placeholder="请输入备注"
              rows={3}
            />
          </Form.Item>

          <div className="form-actions">
            <Button onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingRecord ? '保存' : '新增'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Outbound;
