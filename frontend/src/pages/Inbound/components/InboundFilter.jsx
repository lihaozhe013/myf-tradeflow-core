import React from 'react';
import { Select, DatePicker, Button, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const InboundFilter = ({ 
  filters, 
  setFilters, 
  partners, 
  products, 
  onFilter 
}) => {
  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={5}>
        <Select
          allowClear
          showSearch
          placeholder="选择供应商"
          style={{ width: '100%' }}
          value={filters.supplier_short_name}
          onChange={v => setFilters(f => ({ ...f, supplier_short_name: v }))}
          options={partners.map(p => ({ label: `${p.short_name}(${p.code})`, value: p.short_name }))}
          filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
        />
      </Col>
      <Col span={5}>
        <Select
          allowClear
          showSearch
          placeholder="选择产品型号"
          style={{ width: '100%' }}
          value={filters.product_model}
          onChange={v => setFilters(f => ({ ...f, product_model: v }))}
          options={products.map(p => ({ label: `${p.product_model}(${p.code})`, value: p.product_model }))}
          filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
        />
      </Col>
      <Col span={8}>
        <DatePicker.RangePicker
          style={{ width: '100%' }}
          value={filters.dateRange && filters.dateRange[0] ? [dayjs(filters.dateRange[0]), dayjs(filters.dateRange[1])] : []}
          onChange={dates => setFilters(f => ({ ...f, dateRange: dates ? [dates[0]?.format('YYYY-MM-DD'), dates[1]?.format('YYYY-MM-DD')] : [] }))}
          format="YYYY-MM-DD"
          placeholder={['开始日期', '结束日期']}
        />
      </Col>
      <Col span={3}>
        <Button type="primary" icon={<SearchOutlined />} onClick={onFilter}>
          筛选
        </Button>
      </Col>
    </Row>
  );
};

export default InboundFilter;
