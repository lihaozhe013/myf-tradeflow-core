import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
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
import { PRODUCT_CATEGORIES } from '../config/index.js';

const { Title } = Typography;
const { Option } = Select;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  // 新增：用于联动输入的下拉数据
  const [productOptions, setProductOptions] = useState([]);

  // 获取产品列表
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (response.ok) {
        const result = await response.json();
        setProducts(Array.isArray(result.data) ? result.data : []);
        setProductOptions(Array.isArray(result.data) ? result.data : []);
      } else {
        setProducts([]);
        setProductOptions([]);
      }
    } catch {
      setProducts([]);
      setProductOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 调试日志：检查配置导入
    // eslint-disable-next-line no-console
    console.log('PRODUCT_CATEGORIES:', PRODUCT_CATEGORIES, Array.isArray(PRODUCT_CATEGORIES));
    fetchProducts();
  }, []);

  // 新增产品
  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 编辑产品
  const handleEdit = (record) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  // 删除产品
  const handleDelete = async (code) => {
    try {
      const response = await fetch(`/api/products/${code}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        message.success('删除成功');
        fetchProducts();
      } else {
        message.error('删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  };

  // 保存产品
  const handleSave = async (values) => {
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.code}`
        : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const body = { ...values };
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        message.success(editingProduct ? '修改成功' : '新增成功');
        setModalVisible(false);
        fetchProducts();
      } else {
        const errorData = await response.json();
        message.error(errorData.error || '保存失败');
      }
    } catch {
      message.error('保存失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '代号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '产品型号',
      dataIndex: 'product_model',
      key: 'product_model',
      width: 200,
    },
    {
      title: '产品分类',
      dataIndex: 'category',
      key: 'category',
      width: 150,
    },
    {
      title: '产品描述',
      dataIndex: 'remark',
      key: 'remark',
      width: 300,
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
            title="确定要删除这个产品吗？"
            onConfirm={() => handleDelete(record.code)}
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

  // 联动输入处理（仅按code和型号联动）
  const handleProductFieldChange = (changed) => {
    if (changed.code) {
      const match = productOptions.find(p => p.code === changed.code);
      if (match) {
        form.setFieldsValue({ product_model: match.product_model });
      }
    } else if (changed.product_model) {
      const match = productOptions.find(p => p.product_model === changed.product_model);
      if (match) {
        form.setFieldsValue({ code: match.code });
      }
    }
  };

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>产品管理</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增产品
            </Button>
          </Col>
        </Row>

        <Divider />

        <div className="responsive-table">
          <Table
            columns={columns}
            dataSource={products}
            rowKey="code"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            }}
            scroll={{ x: 900 }}
          />
        </div>
      </Card>

      <Modal
        title={editingProduct ? '编辑产品' : '新增产品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          onValuesChange={handleProductFieldChange}
        >
          <Form.Item
            label="代号"
            name="code"
            rules={[
              { required: true, message: '请输入代号' },
              { max: 50, message: '代号不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入代号" disabled={!!editingProduct} />
          </Form.Item>

          <Form.Item
            label="产品型号"
            name="product_model"
            rules={[
              { required: true, message: '请输入产品型号' },
              { max: 100, message: '产品型号不能超过100个字符' },
            ]}
          >
            <Input placeholder="请输入产品型号" disabled={!!editingProduct} />
          </Form.Item>

          <Form.Item
            label="产品分类"
            name="category"
            rules={[
              { required: true, message: '请选择产品分类' },
              { max: 100, message: '产品分类不能超过100个字符' },
            ]}
          >
            <Select
              showSearch
              allowClear
              placeholder="请选择产品分类"
              options={PRODUCT_CATEGORIES.map(name => ({ value: name, label: name }))}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            label="产品描述"
            name="remark"
            rules={[{ max: 500, message: '产品描述不能超过500个字符' }]}
          >
            <Input.TextArea
              placeholder="请输入产品描述"
              rows={4}
            />
          </Form.Item>

          <div className="form-actions">
            <Button onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingProduct ? '保存' : '新增'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
