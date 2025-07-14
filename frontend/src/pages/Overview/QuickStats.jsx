import { Card, Row, Col, Statistic } from 'antd';
import { ImportOutlined, ExportOutlined, InboxOutlined } from '@ant-design/icons';
import React from 'react';

/**
 * 快速统计卡片组件
 * @param {Object} overview - 概览数据
 */
const QuickStats = ({ overview = {} }) => (
  <Card
    title="快速统计"
    bordered={false}
    style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', height: '100%' }}
  >
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Statistic
          title="入库记录总数"
          value={overview.total_inbound}
          prefix={<ImportOutlined />}
          valueStyle={{ color: '#52c41a' }}
        />
      </Col>
      <Col span={24}>
        <Statistic
          title="出库记录总数"
          value={overview.total_outbound}
          prefix={<ExportOutlined />}
          valueStyle={{ color: '#fa8c16' }}
        />
      </Col>
      <Col span={24}>
        <Statistic
          title="在库产品种类"
          value={overview.stocked_products}
          prefix={<InboxOutlined />}
          valueStyle={{ color: '#1677ff' }}
        />
      </Col>
    </Row>
  </Card>
);

export default QuickStats;
