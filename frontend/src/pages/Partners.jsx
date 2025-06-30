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

const Partners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [form] = Form.useForm();

  // 获取合作伙伴列表
  const fetchPartners = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // 新增合作伙伴
  const handleAdd = () => {
    setEditingPartner(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 编辑合作伙伴
  const handleEdit = (record) => {
    setEditingPartner(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  // 删除合作伙伴
  const handleDelete = async (shortName) => {
    try {
      const response = await fetch(`/api/partners/${shortName}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        message.success('删除成功');
        fetchPartners();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 保存合作伙伴
  const handleSave = async (values) => {
    try {
      const url = editingPartner 
        ? `/api/partners/${editingPartner.short_name}`
        : '/api/partners';
      const method = editingPartner ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(editingPartner ? '修改成功' : '新增成功');
        setModalVisible(false);
        fetchPartners();
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
      title: '简称',
      dataIndex: 'short_name',
      key: 'short_name',
      width: 100,
    },
    {
      title: '全称',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => type === 0 ? '供应商' : '客户',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 200,
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
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
            title="确定要删除这个合作伙伴吗？"
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
            <Title level={3} style={{ margin: 0 }}>客户/供应商管理</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增合作伙伴
            </Button>
          </Col>
        </Row>

        <Divider />

        <div className="responsive-table">
          <Table
            columns={columns}
            dataSource={partners}
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
        title={editingPartner ? '编辑合作伙伴' : '新增合作伙伴'}
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
            label="简称"
            name="short_name"
            rules={[
              { required: true, message: '请输入简称' },
              { max: 50, message: '简称不能超过50个字符' },
            ]}
          >
            <Input
              placeholder="请输入简称"
              disabled={!!editingPartner}
            />
          </Form.Item>

          <Form.Item
            label="全称"
            name="full_name"
            rules={[
              { required: true, message: '请输入全称' },
              { max: 200, message: '全称不能超过200个字符' },
            ]}
          >
            <Input placeholder="请输入全称" />
          </Form.Item>

          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择类型">
              <Option value={0}>供应商</Option>
              <Option value={1}>客户</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="地址"
            name="address"
            rules={[{ max: 500, message: '地址不能超过500个字符' }]}
          >
            <Input.TextArea
              placeholder="请输入地址"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            label="联系人"
            name="contact_person"
            rules={[{ max: 100, message: '联系人不能超过100个字符' }]}
          >
            <Input placeholder="请输入联系人" />
          </Form.Item>

          <Form.Item
            label="联系电话"
            name="contact_phone"
            rules={[{ max: 50, message: '联系电话不能超过50个字符' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <div className="form-actions">
            <Button onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingPartner ? '保存' : '新增'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Partners;
