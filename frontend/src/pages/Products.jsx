import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
        message.success(t('products.deleteSuccess'));
        fetchProducts();
      } else {
        message.error(t('products.deleteFailed'));
      }
    } catch {
      message.error(t('products.deleteFailed'));
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
        message.success(editingProduct ? t('products.editSuccess') : t('products.addSuccess'));
        setModalVisible(false);
        fetchProducts();
      } else {
        const errorData = await response.json();
        message.error(errorData.error || t('products.saveFailed'));
      }
    } catch {
      message.error(t('products.saveFailed'));
    }
  };

  // 表格列定义
  const columns = [
    {
      title: t('products.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: t('products.productModel'),
      dataIndex: 'product_model',
      key: 'product_model',
      width: 200,
    },
    {
      title: t('products.category'),
      dataIndex: 'category',
      key: 'category',
      width: 150,
    },
    {
      title: t('products.remark'),
      dataIndex: 'remark',
      key: 'remark',
      width: 300,
    },
    {
      title: t('products.actions'),
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
            title={t('products.deleteConfirm')}
            onConfirm={() => handleDelete(record.code)}
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
            <Title level={2} style={{ margin: 0 }}>{t('products.title')}</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              {t('products.addProduct')}
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
              showQuickJumper: true,
              showTotal: (total, range) =>
                t('products.paginationTotal', { start: range[0], end: range[1], total }),
            }}
            scroll={{ x: 900 }}
          />
        </div>
      </Card>

      <Modal
        title={editingProduct ? t('products.editProduct') : t('products.addProduct')}
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
            label={t('products.code')}
            name="code"
            rules={[
              { required: true, message: t('products.inputCode') },
              { max: 50, message: t('products.codeMax') },
            ]}
          >
            <Input placeholder={t('products.inputCode')} disabled={!!editingProduct} />
          </Form.Item>

          <Form.Item
            label={t('products.productModel')}
            name="product_model"
            rules={[
              { required: true, message: t('products.inputProductModel') },
              { max: 100, message: t('products.productModelMax') },
            ]}
          >
            <Input placeholder={t('products.inputProductModel')} disabled={!!editingProduct} />
          </Form.Item>

          <Form.Item
            label={t('products.category')}
            name="category"
            rules={[
              { required: true, message: t('products.selectCategory') },
              { max: 100, message: t('products.categoryMax') },
            ]}
          >
            <Select
              showSearch
              allowClear
              placeholder={t('products.selectCategory')}
              options={PRODUCT_CATEGORIES.map(name => ({ value: name, label: name }))}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            label={t('products.remark')}
            name="remark"
            rules={[{ max: 500, message: t('products.remarkMax') }]}
          >
            <Input.TextArea
              placeholder={t('products.inputRemark')}
              rows={4}
            />
          </Form.Item>

          <div className="form-actions">
            <Button onClick={() => setModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="primary" htmlType="submit">
              {editingProduct ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
