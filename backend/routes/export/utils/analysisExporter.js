// 分析数据导出器
const XLSX = require('xlsx');

class AnalysisExporter {
  constructor(templates) {
    this.templates = templates;
  }

  /**
   * 导出分析数据
   * @param {Object} options - 导出选项
   * @returns {Buffer} Excel文件Buffer
   */
  exportAnalysis(options = {}) {
    const { analysisData, detailData, startDate, endDate, customerCode, productModel } = options;
    
    const workbook = XLSX.utils.book_new();
    
    // 创建汇总数据工作表
    if (analysisData) {
      const summaryData = [
        {
          metric_name: '销售额',
          amount: `¥${Number(analysisData.sales_amount || 0).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          remark: `时间: ${startDate} 至 ${endDate}`
        },
        {
          metric_name: '成本',
          amount: `¥${Number(analysisData.cost_amount || 0).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          remark: `客户: ${customerCode || '全部'}, 产品: ${productModel || '全部'}`
        },
        {
          metric_name: '利润',
          amount: `¥${Number(analysisData.profit_amount || 0).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          remark: `更新时间: ${analysisData.last_updated || ''}`
        },
        {
          metric_name: '利润率',
          amount: `${Number(analysisData.profit_rate || 0).toFixed(2)}%`,
          remark: '基于加权平均成本法计算'
        }
      ];
      
      const summaryWorksheet = this.createWorksheet(summaryData, this.templates.analysis_summary);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, this.templates.analysis_summary.sheetName);
    }
    
    // 创建详细数据工作表
    if (detailData && detailData.length > 0) {
      // 确定详细数据的类型和使用的模板
      const hasSpecificCustomer = customerCode && customerCode !== 'ALL';
      const hasSpecificProduct = productModel && productModel !== 'ALL';
      
      let template, formattedDetailData;
      
      if (hasSpecificCustomer && !hasSpecificProduct) {
        // 指定客户，显示该客户的各产品销售情况
        template = this.templates.analysis_detail_by_product;
        formattedDetailData = detailData.map(item => ({
          product_model: item.product_model || '',
          sales_amount: `¥${Number(item.sales_amount || 0).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          cost_amount: `¥${Number(item.cost_amount || 0).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          profit_amount: `¥${Number(item.profit_amount || 0).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          profit_rate: `${Number(item.profit_rate || 0).toFixed(2)}%`
        }));
      } else if (!hasSpecificCustomer && hasSpecificProduct) {
        // 指定产品，显示该产品的各客户销售情况
        template = this.templates.analysis_detail_by_customer;
        formattedDetailData = detailData.map(item => ({
          customer_code: item.customer_code || '',
          customer_name: item.customer_name || '',
          sales_amount: `¥${Number(item.sales_amount || 0).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          cost_amount: `¥${Number(item.cost_amount || 0).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          profit_amount: `¥${Number(item.profit_amount || 0).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          profit_rate: `${Number(item.profit_rate || 0).toFixed(2)}%`
        }));
      } else {
        // 全部客户和产品，或者同时指定客户和产品（一般不会有详细数据）
        template = this.templates.analysis_detail;
        formattedDetailData = detailData.map(item => ({
          customer_code: item.customer_code || '',
          customer_name: item.customer_name || '',
          product_model: item.product_model || '',
          sales_amount: `¥${Number(item.sales_amount || 0).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          cost_amount: `¥${Number(item.cost_amount || 0).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          profit_amount: `¥${Number(item.profit_amount || 0).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          profit_rate: `${Number(item.profit_rate || 0).toFixed(2)}%`
        }));
      }
      
      const detailWorksheet = this.createWorksheet(formattedDetailData, template);
      XLSX.utils.book_append_sheet(workbook, detailWorksheet, template.sheetName);
    }
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * 创建工作表
   * @param {Array} data - 数据数组
   * @param {Object} template - 模板配置
   * @returns {Object} 工作表对象
   */
  createWorksheet(data, template) {
    // 创建表头
    const headers = template.columns.map(col => col.label);
    
    // 创建数据行
    const rows = data.map(item => 
      template.columns.map(col => {
        const value = item[col.key];
        // 处理数值类型
        if (typeof value === 'number') {
          return value;
        }
        // 处理其他类型，确保返回字符串
        return value != null ? String(value) : '';
      })
    );
    
    // 合并表头和数据
    const sheetData = [headers, ...rows];
    
    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    // 设置列宽
    const colWidths = template.columns.map(col => {
      // 根据列标签长度设置基础宽度
      const labelWidth = col.label.length * 2;
      // 根据数据类型设置宽度
      let dataWidth = 10;
      if (col.key.includes('date')) {
        dataWidth = 12;
      } else if (col.key.includes('price') || col.key.includes('amount')) {
        dataWidth = 15;
      } else if (col.key.includes('name') || col.key.includes('address')) {
        dataWidth = 20;
      }
      return { wch: Math.max(labelWidth, dataWidth) };
    });
    
    worksheet['!cols'] = colWidths;
    
    return worksheet;
  }
}

module.exports = AnalysisExporter;
