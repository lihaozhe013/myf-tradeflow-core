import React from 'react';
import { Row, Col, Card, Statistic, Alert } from 'antd';
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  RiseOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { currency_unit_symbol } from "@/config/types";

const AnalysisStatistics = ({ analysisData }) => {
  const { t } = useTranslation();

  // 格式化金额
  const formatCurrency = (amount) => {
    return `${currency_unit_symbol}${Number(amount || 0).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // 格式化百分比
  const formatPercentage = (rate) => {
    return `${Number(rate || 0).toFixed(2)}%`;
  };

  if (!analysisData) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Alert
          message={t('analysis.noAnalysisData')}
          description={t('analysis.noAnalysisDataDesc')}
          type="info"
          showIcon
        />
      </div>
    );
  }

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title={t('analysis.salesAmount')}
            value={formatCurrency(analysisData.sales_amount)}
            prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title={t('analysis.cost')}
            value={formatCurrency(analysisData.cost_amount)}
            prefix={<ShoppingCartOutlined style={{ color: '#faad14' }} />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title={t('analysis.profit')}
            value={formatCurrency(analysisData.profit_amount)}
            prefix={<RiseOutlined style={{ color: analysisData.profit_amount >= 0 ? '#52c41a' : '#ff4d4f' }} />}
            valueStyle={{ color: analysisData.profit_amount >= 0 ? '#52c41a' : '#ff4d4f' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title={t('analysis.profitRate')}
            value={formatPercentage(analysisData.profit_rate)}
            prefix={<PercentageOutlined style={{ color: analysisData.profit_rate >= 0 ? '#52c41a' : '#ff4d4f' }} />}
            valueStyle={{ color: analysisData.profit_rate >= 0 ? '#52c41a' : '#ff4d4f' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default AnalysisStatistics;
