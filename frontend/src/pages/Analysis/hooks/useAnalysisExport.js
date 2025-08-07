import { useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

const useAnalysisExport = () => {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  // 执行普通导出
  const performNormalExport = async (analysisData, detailData, dateRange, selectedCustomer, selectedProduct, customers) => {
    if (!analysisData) {
      message.warning(t('analysis.noDataToExport'));
      return;
    }

    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning(t('analysis.selectTimeRange'));
      return;
    }

    try {
      setExporting(true);
      
      // 处理详细数据，添加客户名称映射
      const processedDetailData = detailData.map(item => {
        const customer = customers.find(c => c.code === item.customer_code);
        return {
          ...item,
          customer_name: customer ? customer.short_name : item.customer_code
        };
      });
      
      const requestBody = {
        analysisData,
        detailData: processedDetailData,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        customerCode: selectedCustomer && selectedCustomer !== 'ALL' ? selectedCustomer : undefined,
        productModel: selectedProduct && selectedProduct !== 'ALL' ? selectedProduct : undefined
      };

      const response = await fetch('/api/export/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || t('analysis.exportFailed'));
      }

      // 获取文件名并下载
      await downloadFile(response, '数据分析导出.xlsx');
      message.success(t('analysis.exportSuccess'));
    } catch (error) {
      console.error('导出失败:', error);
      message.error(error.message || t('analysis.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  // 执行高级导出
  const performAdvancedExport = async (exportType, dateRange) => {
    try {
      setExporting(true);
      
      const requestBody = {
        exportType, // 'customer' 或 'product'
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      };

      const response = await fetch('/api/export/analysis/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || t('analysis.exportFailed'));
      }

      // 获取文件名并下载
      const defaultFilename = `高级分析导出_${exportType === 'customer' ? '按客户分类' : '按产品分类'}.xlsx`;
      await downloadFile(response, defaultFilename);
      message.success(t('analysis.exportSuccess'));
    } catch (error) {
      console.error('高级导出失败:', error);
      message.error(error.message || t('analysis.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  // 下载文件的通用函数
  const downloadFile = async (response, defaultFilename) => {
    // 获取文件名
    const contentDisposition = response.headers.get('content-disposition');
    let filename = defaultFilename;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch) {
        filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
      }
    }

    // 下载文件
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return {
    exporting,
    performNormalExport,
    performAdvancedExport
  };
};

export default useAnalysisExport;
