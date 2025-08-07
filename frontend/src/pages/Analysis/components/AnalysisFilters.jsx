import React from 'react';
import { Row, Col, DatePicker, AutoComplete, Button, Space } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { RangePicker } = DatePicker;

const AnalysisFilters = ({
  dateRange,
  onDateRangeChange,
  selectedCustomer,
  onCustomerChange,
  selectedProduct,
  onProductChange,
  customers,
  products,
  onRefresh,
  onExport,
  refreshing,
  exporting,
  hasData
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* 筛选条件区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <div style={{ marginBottom: 8 }}>
            <strong>{t('analysis.timeRange')}</strong>
          </div>
          <RangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            placeholder={[t('analysis.startDate'), t('analysis.endDate')]}
          />
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div style={{ marginBottom: 8 }}>
            <strong>{t('analysis.customer')}</strong>
          </div>
          <AutoComplete
            value={selectedCustomer}
            onChange={onCustomerChange}
            style={{ width: '100%' }}
            placeholder={t('analysis.selectCustomer')}
            options={customers.map(customer => ({
              value: customer.code,
              label: `${customer.code} - ${customer.name}`
            }))}
            filterOption={(inputValue, option) =>
              option.label.toLowerCase().includes(inputValue.toLowerCase())
            }
            allowClear
          />
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div style={{ marginBottom: 8 }}>
            <strong>{t('analysis.product')}</strong>
          </div>
          <AutoComplete
            value={selectedProduct}
            onChange={onProductChange}
            style={{ width: '100%' }}
            placeholder={t('analysis.selectProduct')}
            options={products.map(product => ({
              value: product.model,
              label: `${product.model} - ${product.name}`
            }))}
            filterOption={(inputValue, option) =>
              option.label.toLowerCase().includes(inputValue.toLowerCase())
            }
            allowClear
          />
        </Col>
      </Row>

      {/* 操作按钮 */}
      <Row style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={refreshing}
            >
              {t('analysis.refreshData')}
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={onExport}
              loading={exporting}
              disabled={!hasData}
            >
              {t('analysis.exportData')}
            </Button>
          </Space>
        </Col>
      </Row>
    </>
  );
};

export default AnalysisFilters;
