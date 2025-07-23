import React from 'react';
import { Modal, List, Typography } from 'antd';

const { Text } = Typography;

const OutOfStockModal = ({ visible, onClose, products }) => {
  return (
    <Modal
      title="缺货产品明细"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      {products && products.length > 0 ? (
        <List
          dataSource={products}
          renderItem={item => (
            <List.Item>
              <Text>{item.product_model}</Text>
            </List.Item>
          )}
        />
      ) : (
        <div style={{ textAlign: 'center', color: '#52c41a', fontSize: 18, padding: '32px 0' }}>
          库存正常
        </div>
      )}
    </Modal>
  );
};

export default OutOfStockModal;
