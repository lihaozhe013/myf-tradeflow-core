import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSimpleApi } from '../../../hooks/useSimpleApi';

const useAnalysisData = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [detailData, setDetailData] = useState([]);

  // 使用认证API
  const apiInstance = useSimpleApi();

  // 获取筛选选项
  const fetchFilterOptions = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiInstance.get('/analysis/filter-options');
      
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 获取分析数据
  const fetchAnalysisData = useCallback(async (dateRange, selectedCustomer, selectedProduct) => {
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
      const result = await apiInstance.get(`/analysis/data?${params}`);
      
      if (result.success) {
        setAnalysisData(result.data);
      } else {
        // 数据未生成，需要刷新
        setAnalysisData(null);
        if (result.status === 503) {
          message.info(t('analysis.dataNotGenerated'));
        } else {
          message.error(result.message || t('analysis.getAnalysisDataFailed'));
        }
      }

      // 获取详细分析数据
      const detailResult = await apiInstance.get(`/analysis/detail?${params}`);
      
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 刷新分析数据
  const refreshAnalysisData = useCallback(async (dateRange, selectedCustomer, selectedProduct) => {
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

      const result = await apiInstance.post('/analysis/refresh', requestBody);
      
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAnalysisData]);

  // 组件挂载时获取筛选选项
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

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
