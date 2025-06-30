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
  Divider
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const ProductPrices = () => {
  const [productPrices, setProductPrices] = useState([]);
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [form] = Form.useForm();

  // 获取产品价格列表
  const fetchProductPrices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/product-prices');
      if (response.ok) {
        const result = await response.json();
        // API返回格式为 {data: [...]}
        setProductPrices(Array.isArray(result.data) ? result.data : []);
      } else {
        console.error('获取产品价格列表失败');
        setProductPrices([]);
      }
    } catch (error) {
      console.error('获取产品价格列表失败:', error);
      setProductPrices([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取合作伙伴列表
  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners');
      if (response.ok) {
        const result = await response.json();
        // API返回格式为 {data: [...]}
        setPartners(Array.isArray(result.data) ? result.data : []);
      } else {
        console.error('获取合作伙伴列表失败');
        setPartners([]);
      }
    } catch (error) {
      console.error('获取合作伙伴列表失败:', error);
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

  useEffect(() => {
    fetchProductPrices();
    fetchPartners();
    fetchProducts();
  }, []);

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
      const response = await fetch(`/api/product-prices/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        message.success('删除成功');
        fetchProductPrices();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 保存价格
  const handleSave = async (values) => {
    try {
      const formattedValues = {
        ...values,
        effective_date: values.effective_date ? values.effective_date.format('YYYY-MM-DD') : null,
      };

      const url = editingPrice 
        ? `/api/product-prices/${editingPrice.id}`
        : '/api/product-prices';
      const method = editingPrice ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });

      if (response.ok) {
        message.success(editingPrice ? '修改成功' : '新增成功');
        setModalVisible(false);
        fetchProductPrices();
      } else {
        const errorData = await response.json();
        message.error(errorData.error || '保存失败');
      }
    } catch (error) {
      message.error('保存失败');
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
      title: '合作伙伴',
      dataIndex: 'partner_short_name',
      key: 'partner_short_name',
      width: 120,
    },
    {
      title: '产品型号',
      dataIndex: 'product_model',
      key: 'product_model',
      width: 150,
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (price) => `¥${price}`,
    },
    {
      title: '生效日期',
      dataIndex: 'effective_date',
      key: 'effective_date',
      width: 120,
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
            title="确定要删除这个价格记录吗？"
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
            <Title level={3} style={{ margin: 0 }}>产品价格管理</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增价格
            </Button>
          </Col>
        </Row>

        <Divider />

        <div className="responsive-table">
          <Table
            columns={columns}
            dataSource={productPrices}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            }}
            scroll={{ x: 800 }}
          />
        </div>
      </Card>

      <Modal
        title={editingPrice ? '编辑产品价格' : '新增产品价格'}
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
          <Form.Item
            label="合作伙伴"
            name="partner_short_name"
            rules={[{ required: true, message: '请选择合作伙伴' }]}
          >
            <Select placeholder="请选择合作伙伴" showSearch>
              {partners.map(partner => (
                <Option key={partner.short_name} value={partner.short_name}>
                  {partner.short_name} - {partner.full_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="产品型号"
            name="product_model"
            rules={[{ required: true, message: '请选择产品型号' }]}
          >
            <Select placeholder="请选择产品型号" showSearch>
              {products.map(product => (
                <Option key={product.product_model} value={product.product_model}>
                  {product.product_model} - {product.category}
                </Option>
              ))}
            </Select>
          </Form.Item>

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
            />
          </Form.Item>

          <Form.Item
            label="生效日期"
            name="effective_date"
            rules={[{ required: true, message: '请选择生效日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择生效日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <div className="form-actions">
            <Button onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingPrice ? '保存' : '新增'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductPrices;
