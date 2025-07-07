import React from 'react';
import { Table, Button, Space, Popconfirm, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const OutboundTable = ({ 
  outboundRecords, 
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
            onClick={() => onEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条出库记录吗？"
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
        dataSource={outboundRecords}
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

export default OutboundTable;
