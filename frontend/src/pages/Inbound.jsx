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
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const Inbound = () => {
  const [inboundRecords, setInboundRecords] = useState([]);
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  // 获取入库记录列表
  const fetchInboundRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inbound');
      if (response.ok) {
        const result = await response.json();
        // API返回格式为 {data: [...], pagination: {...}}
        setInboundRecords(Array.isArray(result.data) ? result.data : []);
      } else {
        console.error('获取入库记录列表失败');
        setInboundRecords([]);
      }
    } catch (error) {
      console.error('获取入库记录列表失败:', error);
      setInboundRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取供应商列表
  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners');
      if (response.ok) {
        const result = await response.json();
        // API返回格式为 {data: [...]}
        const partnersArray = Array.isArray(result.data) ? result.data : [];
        setPartners(partnersArray.filter(partner => partner.type === 0)); // 只获取供应商
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
    fetchInboundRecords();
    fetchPartners();
    fetchProducts();
  }, []);

  // 新增入库记录
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    // 设置默认入库日期为今天
    form.setFieldsValue({
      inbound_date: dayjs(),
    });
    setModalVisible(true);
  };

  // 编辑入库记录
  const handleEdit = (record) => {
    setEditingRecord(record);
    // 需要根据简称和型号找到对应的代号
    const supplier = partners.find(p => p.short_name === record.supplier_short_name);
    const product = products.find(p => p.product_model === record.product_model);
    
    form.setFieldsValue({
      ...record,
      supplier_code: supplier?.code || '',
      product_code: product?.code || '',
      inbound_date: record.inbound_date ? dayjs(record.inbound_date) : null,
      invoice_date: record.invoice_date ? dayjs(record.invoice_date) : null,
      payment_date: record.payment_date ? dayjs(record.payment_date) : null,
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
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 保存入库记录
  const handleSave = async (values) => {
    try {
      // 强绑定校验：检查代号和简称/型号是否匹配
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
        payment_date: values.payment_date ? values.payment_date.format('YYYY-MM-DD') : null,
        // 计算总价和应付金额
        total_price: (values.quantity || 0) * (values.unit_price || 0),
        payable_amount: ((values.quantity || 0) * (values.unit_price || 0)) - (values.payment_amount || 0),
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
    } catch (error) {
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
    const supplierShortName = form.getFieldValue('supplier_short_name');
    const productModel = form.getFieldValue('product_model');
    const inboundDate = form.getFieldValue('inbound_date');

    if (supplierShortName && productModel && inboundDate) {
      const price = await fetchCurrentPrice(
        supplierShortName,
        productModel,
        inboundDate.format('YYYY-MM-DD')
      );
      if (price > 0) {
        form.setFieldsValue({ unit_price: price });
        // 触发总价计算
        handlePriceOrQuantityChange();
      }
    }
  };

  // 处理价格或数量变化，自动计算总价和应付金额
  const handlePriceOrQuantityChange = () => {
    const quantity = form.getFieldValue('quantity') || 0;
    const unitPrice = form.getFieldValue('unit_price') || 0;
    const paymentAmount = form.getFieldValue('payment_amount') || 0;
    
    const totalPrice = quantity * unitPrice;
    const payableAmount = totalPrice - paymentAmount;

    form.setFieldsValue({
      total_price: totalPrice,
      payable_amount: payableAmount,
    });
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
      title: '供应商代号',
      dataIndex: 'supplier_code',
      key: 'supplier_code',
      width: 100,
    },
    {
      title: '供应商简称',
      dataIndex: 'supplier_short_name',
      key: 'supplier_short_name',
      width: 120,
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
    },
    {
      title: '总价',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 100,
      render: (price) => `¥${price}`,
    },
    {
      title: '入库日期',
      dataIndex: 'inbound_date',
      key: 'inbound_date',
      width: 120,
    },
    {
      title: '付款状态',
      key: 'payment_status',
      width: 100,
      render: (_, record) => {
        const payableAmount = record.payable_amount || 0;
        if (payableAmount <= 0) {
          return <Tag color="green">已付清</Tag>;
        } else if (record.payment_amount > 0) {
          return <Tag color="orange">部分付款</Tag>;
        } else {
          return <Tag color="red">未付款</Tag>;
        }
      },
    },
    {
      title: '应付金额',
      dataIndex: 'payable_amount',
      key: 'payable_amount',
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
            title="确定要删除这条入库记录吗？"
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

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>入库管理</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增入库记录
            </Button>
          </Col>
        </Row>

        <Divider />

        <div className="responsive-table">
          <Table
            columns={columns}
            dataSource={inboundRecords}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            }}
            scroll={{ x: 1200 }}
          />
        </div>
      </Card>

      <Modal
        title={editingRecord ? '编辑入库记录' : '新增入库记录'}
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
                label="供应商代号"
                name="supplier_code"
                rules={[{ required: true, message: '请输入供应商代号' }]}
              >
                <AutoComplete
                  placeholder="请输入供应商代号"
                  onChange={handleSupplierCodeChange}
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
                label="供应商简称"
                name="supplier_short_name"
                rules={[{ required: true, message: '请输入供应商简称' }]}
              >
                <AutoComplete
                  placeholder="请输入供应商简称"
                  onChange={handleSupplierShortNameChange}
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
                label="供应商全称"
                name="supplier_full_name"
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
                label="入库日期"
                name="inbound_date"
                rules={[{ required: true, message: '请选择入库日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择入库日期"
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
                label="付款金额"
                name="payment_amount"
                rules={[{ type: 'number', min: 0, message: '付款金额必须大于等于0' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入付款金额"
                  precision={2}
                  min={0}
                  addonBefore="¥"
                  onChange={handlePriceOrQuantityChange}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="应付金额"
                name="payable_amount"
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
                label="付款日期"
                name="payment_date"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择付款日期"
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
                label="付款方式"
                name="payment_method"
              >
                <Select placeholder="请选择付款方式">
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

export default Inbound;
