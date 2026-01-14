import React from 'react';
import { Modal, Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { UserOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { AnalysisType } from '@/types/analysis';

interface AdvancedExportModalProps {
  visible: boolean;
  onCancel: () => void;
  onExport: (type: 'customer' | 'product') => void; // Using 'customer' key for both customer/supplier to match backend usually, or adapt.
  exporting: boolean;
  analysisType: AnalysisType;
}

const AdvancedExportModal: React.FC<AdvancedExportModalProps> = ({ 
    visible, 
    onCancel, 
    onExport, 
    exporting,
    analysisType 
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t('analysis.advancedExport') || "Advanced Export"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={500}
    >
      <p>{t('analysis.selectExportType') || "Please select export grouping type:"}</p>
      
      <Space direction="vertical" style={{ width: '100%', marginTop: 20 }}>
        <Button 
          block 
          size="large" 
          icon={<UserOutlined />}
          onClick={() => onExport('customer')}
          loading={exporting}
        >
          {analysisType === 'outbound' 
            ? (t('analysis.exportByCustomer') || "Export by Customer") 
            : (t('analysis.exportBySupplier') || "Export by Supplier")}
        </Button>
        
        <Button 
          block 
          size="large" 
          icon={<AppstoreOutlined />}
          onClick={() => onExport('product')}
          loading={exporting}
        >
          {t('analysis.exportByProduct') || "Export by Product"}
        </Button>
      </Space>
    </Modal>
  );
};

export default AdvancedExportModal;
