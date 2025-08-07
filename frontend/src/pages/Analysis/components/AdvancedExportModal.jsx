import React, { useState } from 'react';
import { Modal, Radio, Space, Typography, Alert, Button } from 'antd';
import { FileExcelOutlined, UserOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const AdvancedExportModal = ({ 
  visible, 
  onCancel, 
  onConfirm, 
  loading,
  dateRange,
  customerCount,
  productCount 
}) => {
  const { t } = useTranslation();
  const [exportType, setExportType] = useState('customer');

  const handleConfirm = () => {
    onConfirm(exportType);
  };

  const getEstimatedSheetCount = () => {
    return exportType === 'customer' ? customerCount : productCount;
  };

  const getExportDescription = () => {
    if (exportType === 'customer') {
      return t('analysis.advancedExport.customerDescription');
    } else {
      return t('analysis.advancedExport.productDescription');
    }
  };

  return (
    <Modal
      title={
        <Space>
          <FileExcelOutlined />
          {t('analysis.advancedExport.title')}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('common.cancel')}
        </Button>,
        <Button 
          key="confirm" 
          type="primary" 
          loading={loading}
          onClick={handleConfirm}
          icon={<FileExcelOutlined />}
        >
          {t('analysis.advancedExport.startExport')}
        </Button>
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 说明信息 */}
        <Alert
          message={t('analysis.advancedExport.notice')}
          description={t('analysis.advancedExport.noticeDescription')}
          type="info"
          showIcon
        />

        {/* 时间范围显示 */}
        <div>
          <Text strong>{t('analysis.timeRange')}: </Text>
          <Text>
            {dateRange[0]?.format('YYYY-MM-DD')} {t('analysis.to')} {dateRange[1]?.format('YYYY-MM-DD')}
          </Text>
        </div>

        {/* 导出方式选择 */}
        <div>
          <Title level={5}>{t('analysis.advancedExport.exportMethod')}</Title>
          <Radio.Group 
            value={exportType} 
            onChange={(e) => setExportType(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Radio value="customer">
                <Space>
                  <UserOutlined />
                  <div>
                    <div><strong>{t('analysis.advancedExport.byCustomer')}</strong></div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {t('analysis.advancedExport.byCustomerDesc')}
                    </div>
                  </div>
                </Space>
              </Radio>
              
              <Radio value="product">
                <Space>
                  <AppstoreOutlined />
                  <div>
                    <div><strong>{t('analysis.advancedExport.byProduct')}</strong></div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {t('analysis.advancedExport.byProductDesc')}
                    </div>
                  </div>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        {/* 导出预览信息 */}
        <Alert
          message={t('analysis.advancedExport.exportPreview')}
          description={
            <Space direction="vertical">
              <Text>{getExportDescription()}</Text>
              <Text>
                <strong>{t('analysis.advancedExport.estimatedSheets')}: </strong>
                {getEstimatedSheetCount()} {t('analysis.advancedExport.sheets')}
              </Text>
            </Space>
          }
          type="success"
          showIcon
        />

        {/* 注意事项 */}
        <Alert
          message={t('analysis.advancedExport.warning')}
          description={t('analysis.advancedExport.warningDescription')}
          type="warning"
          showIcon
        />
      </Space>
    </Modal>
  );
};

export default AdvancedExportModal;
