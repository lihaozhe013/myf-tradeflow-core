import React from 'react';
import { Table, Button, Space, Popconfirm, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
const InboundTable = ({ 
  inboundRecords, 
  loading, 
  partners, 
  products, 
  selectedRowKeys, 
  setSelectedRowKeys, 
  onEdit, 
  onDelete, 
  onTableChange,
  pagination 
}) => {
  const { t } = useTranslation();
  const columns = [
    {
      title: t('inbound.id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('inbound.supplierCode'),
      dataIndex: 'supplier_code',
      key: 'supplier_code',
      width: 100,
    },
    {
      title: t('inbound.supplierShortName'),
      dataIndex: 'supplier_short_name',
      key: 'supplier_short_name',
      width: 120,
      filters: partners.map(p => ({ text: p.short_name, value: p.short_name })),
      onFilter: (value, record) => record.supplier_short_name === value,
    },
    {
      title: t('inbound.productCode'),
      dataIndex: 'product_code',
      key: 'product_code',
      width: 100,
    },
    {
      title: t('inbound.productModel'),
      dataIndex: 'product_model',
      key: 'product_model',
      width: 150,
      filters: products.map(p => ({ text: p.product_model, value: p.product_model })),
      onFilter: (value, record) => record.product_model === value,
    },
    {
      title: t('inbound.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: t('inbound.unitPrice'),
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (price) => `¥${price}`,
      sorter: true,
    },
    {
      title: t('inbound.totalPrice'),
      dataIndex: 'total_price',
      key: 'total_price',
      width: 100,
      render: (price) => `¥${price}`,
      sorter: true,
    },
    {
      title: t('inbound.inboundDate'),
      dataIndex: 'inbound_date',
      key: 'inbound_date',
      width: 120,
      sorter: true,
    },
    {
      title: t('inbound.invoiceLink'),
      key: 'invoice_link',
      width: 120,
      render: (_, record) => {
        if (record.invoice_image_url && record.invoice_image_url.trim()) {
          return (
            <Button
              type="link"
              size="small"
              onClick={() => window.open(record.invoice_image_url, '_blank')}
              style={{ padding: 0 }}
            >
              {t('inbound.viewInvoice')}
            </Button>
          );
        }
        return <span style={{ color: '#999' }}>{t('inbound.noInvoice')}</span>;
      },
    },
    {
      title: t('inbound.actions'),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            size="small"
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('inbound.deleteConfirm')}
            onConfirm={() => onDelete(record.id)}
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

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div className="responsive-table">
      <Table
        columns={columns}
        dataSource={inboundRecords}
        rowKey="id"
        loading={loading}
        rowSelection={rowSelection}
        onChange={onTableChange}
        pagination={pagination}
        scroll={{ x: 1320 }}
      />
    </div>
  );
};

export default InboundTable;
