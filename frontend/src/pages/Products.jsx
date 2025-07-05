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

const { Title } = Typography;
const { Option } = Select;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // 获取产品列表
  const fetchProducts = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // 获取产品类型列表
  const fetchCategories = async () => {
    setCategoryLoading(true);
    try {
      const res = await fetch('/api/product-categories');
      if (res.ok) {
        const result = await res.json();
        setCategoryOptions(Array.isArray(result.data) ? result.data : []);
      } else {
        setCategoryOptions([]);
      }
    } catch {
      setCategoryOptions([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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
  const handleDelete = async (shortName) => {
    try {
      const response = await fetch(`/api/products/${shortName}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        message.success('删除成功');
        fetchProducts();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 保存产品
  const handleSave = async (values) => {
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.short_name}`
        : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const body = { ...values };
      if (!editingProduct) {
        body.short_name = values.short_name;
      }
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
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '产品简称',
      dataIndex: 'short_name',
      key: 'short_name',
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
            onConfirm={() => handleDelete(record.short_name)}
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
            rowKey="short_name"
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
        >
          <Form.Item
            label="产品简称"
            name="short_name"
            rules={[
              { required: true, message: '请输入产品简称' },
              { max: 100, message: '产品简称不能超过100个字符' },
            ]}
          >
            <Input
              placeholder="请输入产品简称"
              disabled={!!editingProduct}
            />
          </Form.Item>

          <Form.Item
            label="产品型号"
            name="product_model"
            rules={[
              { required: true, message: '请输入产品型号' },
              { max: 100, message: '产品型号不能超过100个字符' },
            ]}
          >
            <Input
              placeholder="请输入产品型号"
              disabled={!!editingProduct}
            />
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
              placeholder="请选择或输入产品分类"
              loading={categoryLoading}
              options={categoryOptions.map(name => ({ value: name, label: name }))}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              dropdownRender={menu => (
                <>
                  {menu}
                  <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
                    <Input
                      style={{ flex: 'auto' }}
                      placeholder="新增产品分类"
                      onPressEnter={async e => {
                        const value = e.target.value.trim();
                        if (!value) return;
                        if (categoryOptions.includes(value)) return;
                        setCategoryLoading(true);
                        try {
                          const res = await fetch('/api/product-categories', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: value })
                          });
                          if (res.ok) {
                            setCategoryOptions(prev => [...prev, value]);
                            message.success('产品分类添加成功');
                          } else {
                            const err = await res.json();
                            message.error(err.error || '添加失败');
                          }
                        } finally {
                          setCategoryLoading(false);
                        }
                      }}
                    />
                  </div>
                </>
              )}
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
