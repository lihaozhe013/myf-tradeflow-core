import { useState, useEffect } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

const useAnalysisData = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [detailData, setDetailData] = useState([]);

  // 获取筛选选项
  const fetchFilterOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analysis/filter-options');
      const result = await response.json();
      
      if (result.success) {
        setCustomers(result.customers);
        setProducts(result.products);
      } else {
        message.error(t('analysis.getFilterOptionsFailed'));
      }
    } catch (error) {
      console.error('获取筛选选项失败:', error);
      message.error(t('analysis.getFilterOptionsFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 获取分析数据
  const fetchAnalysisData = async (dateRange, selectedCustomer, selectedProduct) => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning(t('analysis.selectTimeRange'));
      return;
    }

    // 检查是否至少选择了一个筛选条件
    if (!selectedCustomer && !selectedProduct) {
      // 如果没有选择任何筛选条件，清空数据但不显示错误
      setAnalysisData(null);
      setDetailData([]);
      return;
    }

    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      });
      
      if (selectedCustomer && selectedCustomer !== 'ALL') {
        params.append('customer_code', selectedCustomer);
      }
      
      if (selectedProduct && selectedProduct !== 'ALL') {
        params.append('product_model', selectedProduct);
      }

      // 获取基本分析数据
      const response = await fetch(`/api/analysis/data?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setAnalysisData(result.data);
      } else {
        // 数据未生成，需要刷新
        setAnalysisData(null);
        if (response.status === 503) {
          message.info(t('analysis.dataNotGenerated'));
        } else {
          message.error(result.message || t('analysis.getAnalysisDataFailed'));
        }
      }

      // 获取详细分析数据
      const detailResponse = await fetch(`/api/analysis/detail?${params}`);
      const detailResult = await detailResponse.json();
      
      if (detailResult.success) {
        setDetailData(detailResult.data.detail_data || []);
      } else {
        setDetailData([]);
      }
    } catch (error) {
      console.error('获取分析数据失败:', error);
      message.error(t('analysis.getAnalysisDataFailed'));
      setAnalysisData(null);
      setDetailData([]);
    } finally {
      setLoading(false);
    }
  };

  // 刷新分析数据
  const refreshAnalysisData = async (dateRange, selectedCustomer, selectedProduct) => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning(t('analysis.selectTimeRange'));
      return;
    }

    // 检查是否至少选择了一个筛选条件
    if (!selectedCustomer && !selectedProduct) {
      message.warning(t('analysis.selectFilterCondition'));
      return;
    }

    try {
      setRefreshing(true);
      
      const requestBody = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      };
      
      if (selectedCustomer && selectedCustomer !== 'ALL') {
        requestBody.customer_code = selectedCustomer;
      }
      
      if (selectedProduct && selectedProduct !== 'ALL') {
        requestBody.product_model = selectedProduct;
      }

      const response = await fetch('/api/analysis/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysisData(result.data);
        message.success(t('analysis.refreshSuccess'));
        
        // 刷新成功后也要获取详细数据
        fetchAnalysisData(dateRange, selectedCustomer, selectedProduct);
      } else {
        message.error(result.message || t('analysis.refreshFailed'));
      }
    } catch (error) {
      console.error('刷新数据失败:', error);
      message.error(t('analysis.refreshFailed'));
    } finally {
      setRefreshing(false);
    }
  };

  // 组件挂载时获取筛选选项
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  return {
    loading,
    refreshing,
    customers,
    products,
    analysisData,
    detailData,
    fetchAnalysisData,
    refreshAnalysisData
  };
};

export default useAnalysisData;
