import React from 'react';
import { Table, Button, Space, Popconfirm, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const InboundTable = ({ 
  inboundRecords, 
  loading, 
  partners, 
  products, 
  selectedRowKeys, 
  setSelectedRowKeys, 
  onEdit, 
  onDelete, 
  onTableChange 
}) => {
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
      filters: partners.map(p => ({ text: p.short_name, value: p.short_name })),
      onFilter: (value, record) => record.supplier_short_name === value,
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
      title: '入库日期',
      dataIndex: 'inbound_date',
      key: 'inbound_date',
      width: 120,
      sorter: true,
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
            onClick={() => onEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条入库记录吗？"
            onConfirm={() => onDelete(record.id)}
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
    <div className="responsive-table">
      <Table
        columns={columns}
        dataSource={inboundRecords}
        rowKey="id"
        loading={loading}
        rowSelection={rowSelection}
        onChange={onTableChange}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
        }}
        scroll={{ x: 1200 }}
      />
    </div>
  );
};

export default InboundTable;
