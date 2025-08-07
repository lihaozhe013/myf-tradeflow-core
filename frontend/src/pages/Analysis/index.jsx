import React, { useState, useEffect } from 'react';
import { Card, Spin, Divider, message, Row, Col, Typography } from 'antd';
const { Title } = Typography;
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

// 组件导入
import AnalysisFilters from './components/AnalysisFilters';
import AnalysisConditions from './components/AnalysisConditions';
import AnalysisStatistics from './components/AnalysisStatistics';
import AnalysisDetailTable from './components/AnalysisDetailTable';
import AdvancedExportModal from './components/AdvancedExportModal';

// Hooks导入
import useAnalysisData from './hooks/useAnalysisData';
import useAnalysisExport from './hooks/useAnalysisExport';

const Analysis = () => {
  const { t } = useTranslation();
  
  // 使用自定义hooks
  const {
    loading,
    refreshing,
    customers,
    products,
    analysisData,
    detailData,
    fetchAnalysisData,
    refreshAnalysisData
  } = useAnalysisData();

  const {
    exporting,
    performNormalExport,
    performAdvancedExport
  } = useAnalysisExport();

  // 本地状态
  const [advancedExportModalVisible, setAdvancedExportModalVisible] = useState(false);
  
  // 筛选条件 - 修改：不再自动选择All，留空
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(1, 'month').startOf('month'), // 上个月第一天
    dayjs().subtract(1, 'month').endOf('month')     // 上个月最后一天
  ]);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // 改为null，不自动选择All
  const [selectedProduct, setSelectedProduct] = useState(null);   // 改为null，不自动选择All

  // 导出分析数据处理
  const handleExportAnalysis = async () => {
    // 验证必需条件
    if (!analysisData) {
      message.warning(t('analysis.noDataToExport'));
      return;
    }

    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning(t('analysis.selectTimeRange'));
      return;
    }

    // 如果客户和产品都未选择，或都选择了All，显示高级导出选项Modal
    if ((!selectedCustomer && !selectedProduct) || 
        (selectedCustomer === 'All' && selectedProduct === 'All')) {
      setAdvancedExportModalVisible(true);
      return;
    }

    // 普通导出逻辑
    await performNormalExport(
      analysisData, 
      detailData, 
      dateRange, 
      selectedCustomer, 
      selectedProduct, 
      customers
    );
  };

  // 刷新数据处理
  const handleRefreshData = async () => {
    // 验证必需条件
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning(t('analysis.selectTimeRange'));
      return;
    }

    // 检查是否至少选择了一个筛选条件（客户或产品）
    // 注意：选择All也算作有效的筛选条件
    if (!selectedCustomer && !selectedProduct) {
      message.warning(t('analysis.selectFilterCondition'));
      return;
    }

    await refreshAnalysisData(dateRange, selectedCustomer, selectedProduct);
  };

  // 执行高级导出
  const handleAdvancedExport = async (exportType) => {
    setAdvancedExportModalVisible(false);
    await performAdvancedExport(exportType, dateRange);
  };

  // 获取有效客户和产品数量（用于Modal显示）
  const getValidCustomerCount = () => {
    return customers.filter(c => c.code !== 'All').length;
  };

  const getValidProductCount = () => {
    return products.filter(p => p.model !== 'All').length;
  };

  // 筛选条件变化时自动获取数据 - 修改：只有在有筛选条件时才获取
  useEffect(() => {
    if (dateRange && dateRange[0] && dateRange[1] && (selectedCustomer || selectedProduct)) {
      fetchAnalysisData(dateRange, selectedCustomer, selectedProduct);
    }
  }, [dateRange, selectedCustomer, selectedProduct]);

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>{t('analysis.title')}</Title>
          </Col>
        </Row>
        {/* 筛选条件和操作按钮 */}
        <AnalysisFilters
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedCustomer={selectedCustomer}
          onCustomerChange={setSelectedCustomer}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
          customers={customers}
          products={products}
          onRefresh={handleRefreshData}
          onExport={handleExportAnalysis}
          refreshing={refreshing}
          exporting={exporting}
          hasData={!!analysisData}
        />

        <Divider />

        {/* 分析条件显示 */}
        <AnalysisConditions
          dateRange={dateRange}
          selectedCustomer={selectedCustomer}
          selectedProduct={selectedProduct}
          customers={customers}
        />

        {/* 数据展示区域 */}
        <Spin spinning={loading}>
          <AnalysisStatistics analysisData={analysisData} />
        </Spin>

        {/* 数据更新时间 */}
        {analysisData && analysisData.last_updated && (
          <div style={{ textAlign: 'center', marginTop: 24, color: '#666' }}>
            <small>{t('analysis.dataUpdateTime')}: {dayjs(analysisData.last_updated).format('YYYY-MM-DD HH:mm:ss')}</small>
          </div>
        )}

        {/* 详细分析表格 */}
        <AnalysisDetailTable
          detailData={detailData}
          selectedCustomer={selectedCustomer}
          selectedProduct={selectedProduct}
          customers={customers}
        />
      </Card>

      {/* 高级导出Modal */}
      <AdvancedExportModal
        visible={advancedExportModalVisible}
        onCancel={() => setAdvancedExportModalVisible(false)}
        onConfirm={handleAdvancedExport}
        loading={exporting}
        dateRange={dateRange}
        customerCount={getValidCustomerCount()}
        productCount={getValidProductCount()}
      />
    </div>
  );
};

export default Analysis;
