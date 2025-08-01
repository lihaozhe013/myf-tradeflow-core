import React from 'react';
import { Modal, List, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const OutOfStockModal = ({ visible, onClose, products }) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t('overview.outOfStockDetails')}
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
          {t('overview.stockNormal')}
        </div>
      )}
    </Modal>
  );
};

export default OutOfStockModal;
