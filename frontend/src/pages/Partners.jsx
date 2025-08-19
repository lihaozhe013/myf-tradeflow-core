import React, { useState } from 'react';
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
import { useSimpleApi, useSimpleApiData } from '../hooks/useSimpleApi';

const { Title } = Typography;
const { Option } = Select;

const Partners = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [form] = Form.useForm();
  const { t } = useTranslation();

  // 使用简化API hooks
  const { post, put, request } = useSimpleApi();
  
  // 获取合作伙伴列表
  const { 
    data: partnersResponse, 
    loading, 
    refetch: refreshPartners 
  } = useSimpleApiData('/partners', { data: [] });
  
  const partners = partnersResponse?.data || [];
  // 合作伙伴选项用于联动输入
  const partnerOptions = partners;

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
      await request(`/partners/${shortName}`, { method: 'DELETE' });
      message.success(t('partners.deleteSuccess'));
      refreshPartners();
    } catch {
      // 错误已经在useSimpleApi中处理
    }
  };

  // 保存合作伙伴
  const handleSave = async (values) => {
    try {
      if (editingPartner) {
        await put(`/partners/${editingPartner.short_name}`, values);
        message.success(t('partners.editSuccess'));
      } else {
        await post('/partners', values);
        message.success(t('partners.addSuccess'));
      }
      setModalVisible(false);
      refreshPartners();
    } catch {
      // 错误已经在useSimpleApi中处理
    }
  };

  // 表格列定义
  const columns = [
    {
      title: t('partners.code'),
      dataIndex: 'code',
      key: 'code',
      width: 80,
    },
    {
      title: t('partners.shortName'),
      dataIndex: 'short_name',
      key: 'short_name',
      width: 100,
    },
    {
      title: t('partners.fullName'),
      dataIndex: 'full_name',
      key: 'full_name',
      width: 200,
    },
    {
      title: t('partners.type'),
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => type === 0 ? t('partners.supplier') : t('partners.customer'),
    },
    {
      title: t('partners.address'),
      dataIndex: 'address',
      key: 'address',
      width: 200,
    },
    {
      title: t('partners.contactPerson'),
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 100,
    },
    {
      title: t('partners.contactPhone'),
      dataIndex: 'contact_phone',
      key: 'contact_phone',
      width: 120,
    },
    {
      title: t('partners.actions'),
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
            title={t('partners.deleteConfirm')}
            onConfirm={() => handleDelete(record.short_name)}
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

  // 联动输入处理
  const handlePartnerFieldChange = (changed) => {
    // changed: { code/short_name/full_name: value }
    // all: 所有表单值
    if (changed.code) {
      const match = partnerOptions.find(p => p.code === changed.code);
      if (match) {
        form.setFieldsValue({ short_name: match.short_name, full_name: match.full_name });
      }
    } else if (changed.short_name) {
      const match = partnerOptions.find(p => p.short_name === changed.short_name);
      if (match) {
        form.setFieldsValue({ code: match.code, full_name: match.full_name });
      }
    } else if (changed.full_name) {
      const match = partnerOptions.find(p => p.full_name === changed.full_name);
      if (match) {
        form.setFieldsValue({ code: match.code, short_name: match.short_name });
      }
    }
  };

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>{t('partners.title')}</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              {t('partners.addPartner')}
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
              showQuickJumper: true,
              showTotal: (total, range) =>
                t('partners.paginationTotal', { start: range[0], end: range[1], total }),
            }}
            scroll={{ x: 900 }}
          />
        </div>
      </Card>

      <Modal
        title={editingPartner ? t('partners.editPartner') : t('partners.addPartner')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          onValuesChange={handlePartnerFieldChange}
        >
          <Form.Item
            label={t('partners.code')}
            name="code"
            rules={[
              { max: 50, message: t('partners.codeMax') },
            ]}
          >
            <Input placeholder={t('partners.inputCode')} disabled={!!editingPartner} />
          </Form.Item>

          <Form.Item
            label={t('partners.shortName')}
            name="short_name"
            rules={[
              { required: true, message: t('partners.inputShortName') },
              { max: 50, message: t('partners.shortNameMax') },
            ]}
          >
            <Input placeholder={t('partners.inputShortName')} disabled={!!editingPartner} />
          </Form.Item>

          <Form.Item
            label={t('partners.fullName')}
            name="full_name"
            rules={[
              { required: true, message: t('partners.inputFullName') },
              { max: 200, message: t('partners.fullNameMax') },
            ]}
          >
            <Input placeholder={t('partners.inputFullName')} />
          </Form.Item>

          <Form.Item
            label={t('partners.type')}
            name="type"
            rules={[{ required: true, message: t('partners.selectType') }]}
          >
            <Select placeholder={t('partners.selectType')}>
              <Option value={0}>{t('partners.supplier')}</Option>
              <Option value={1}>{t('partners.customer')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={t('partners.address')}
            name="address"
            rules={[{ max: 500, message: t('partners.addressMax') }]}
          >
            <Input.TextArea
              placeholder={t('partners.inputAddress')}
              rows={3}
            />
          </Form.Item>

          <Form.Item
            label={t('partners.contactPerson')}
            name="contact_person"
            rules={[{ max: 100, message: t('partners.contactPersonMax') }]}
          >
            <Input placeholder={t('partners.inputContactPerson')} />
          </Form.Item>

          <Form.Item
            label={t('partners.contactPhone')}
            name="contact_phone"
            rules={[{ max: 50, message: t('partners.contactPhoneMax') }]}
          >
            <Input placeholder={t('partners.inputContactPhone')} />
          </Form.Item>

          <div className="form-actions">
            <Button onClick={() => setModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="primary" htmlType="submit">
              {editingPartner ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Partners;
