
import { Row, Col } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import React from 'react';

/**
 * 库存状态统计卡片组件
 * @param {Object[]} stockAnalysis - 库存分析数据
 */
const StockStatusData = ({ stockAnalysis = [] }) => {
  // 计算库存状态统计
  const getStockStatusData = () => {
    const statusMap = { '缺货': 0, '库存不足': 0, '库存正常': 0, '库存充足': 0 };
    stockAnalysis.forEach(item => {
      statusMap[item.status] = item.count;
    });
    return [
      { status: '缺货', count: statusMap['缺货'], color: '#ff4d4f', icon: <CloseCircleOutlined /> },
      { status: '库存不足', count: statusMap['库存不足'], color: '#faad14', icon: <ExclamationCircleOutlined /> },
      { status: '库存正常', count: statusMap['库存正常'], color: '#52c41a', icon: <CheckCircleOutlined /> },
      { status: '库存充足', count: statusMap['库存充足'], color: '#1890ff', icon: <CheckCircleOutlined /> }
    ];
  };

  return (
    <Row gutter={16} align="middle" style={{ width: '100%' }}>
      {getStockStatusData().map(item => (
        <Col span={6} key={item.status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              borderRadius: '14px',
              border: `2px solid ${item.color}`,
              background: '#fff',
              color: item.color,
              width: '100%',
              minHeight: '210px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'box-shadow 0.2s',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: 4 }}>{item.icon}</div>
            <div style={{ fontSize: '17px', fontWeight: 500 }}>{item.status}</div>
            <div style={{ fontSize: '15px', marginTop: 2 }}>{item.count} 件</div>
          </div>
        </Col>
      ))}
    </Row>
  );
};

export default StockStatusData;
