import React from 'react';
import { Alert, Space } from 'antd';
import { useTranslation } from 'react-i18next';

const AnalysisConditions = ({
  dateRange,
  selectedCustomer,
  selectedProduct,
  customers
}) => {
  const { t } = useTranslation();

  // 获取客户显示名称
  const getCustomerDisplayName = () => {
    if (!selectedCustomer) return t('analysis.allCustomers');
    const customer = customers.find(c => c.code === selectedCustomer);
    return customer ? customer.name : selectedCustomer;
  };

  // 获取产品显示名称
  const getProductDisplayName = () => {
    if (!selectedProduct) return t('analysis.allProducts');
    return selectedProduct;
  };

  if (!dateRange || !dateRange[0] || !dateRange[1]) {
    return null;
  }

  return (
    <Alert
      message={
        <Space>
          <span><strong>{t('analysis.analysisConditions')}:</strong></span>
          <span>{t('analysis.time')}: {dateRange[0].format('YYYY-MM-DD')} {t('analysis.to')} {dateRange[1].format('YYYY-MM-DD')}</span>
          <span>{t('analysis.customer')}: {getCustomerDisplayName()}</span>
          <span>{t('analysis.product')}: {getProductDisplayName()}</span>
        </Space>
      }
      type="info"
      style={{ marginBottom: 24 }}
    />
  );
};

export default AnalysisConditions;
