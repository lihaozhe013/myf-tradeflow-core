// 应收应付导出器
const XLSX = require('xlsx');

class FinancialExporter {
  constructor(templates) {
    this.templates = templates;
  }

  /**
   * 导出应收应付明细
   * @param {Object} data - 数据对象
   * @returns {Buffer} Excel文件Buffer
   */
  exportReceivablePayable(data) {
    const workbook = XLSX.utils.book_new();
    
    // 应收账款汇总
    if (data.receivable_summary && data.receivable_summary.length > 0) {
      const worksheet = this.createWorksheet(data.receivable_summary, this.templates.receivable_summary);
      XLSX.utils.book_append_sheet(workbook, worksheet, this.templates.receivable_summary.sheetName);
    }
    
    // 应收明细
    if (data.receivable_details && data.receivable_details.length > 0) {
      const worksheet = this.createWorksheet(data.receivable_details, this.templates.receivable_details);
      XLSX.utils.book_append_sheet(workbook, worksheet, this.templates.receivable_details.sheetName);
    }
    
    // 回款记录
    if (data.receivable_payments && data.receivable_payments.length > 0) {
      const worksheet = this.createWorksheet(data.receivable_payments, this.templates.receivable_payments);
      XLSX.utils.book_append_sheet(workbook, worksheet, this.templates.receivable_payments.sheetName);
    }
    
    // 应付账款汇总
    if (data.payable_summary && data.payable_summary.length > 0) {
      const worksheet = this.createWorksheet(data.payable_summary, this.templates.payable_summary);
      XLSX.utils.book_append_sheet(workbook, worksheet, this.templates.payable_summary.sheetName);
    }
    
    // 应付明细
    if (data.payable_details && data.payable_details.length > 0) {
      const worksheet = this.createWorksheet(data.payable_details, this.templates.payable_details);
      XLSX.utils.book_append_sheet(workbook, worksheet, this.templates.payable_details.sheetName);
    }
    
    // 付款记录
    if (data.payable_payments && data.payable_payments.length > 0) {
      const worksheet = this.createWorksheet(data.payable_payments, this.templates.payable_payments);
      XLSX.utils.book_append_sheet(workbook, worksheet, this.templates.payable_payments.sheetName);
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

module.exports = FinancialExporter;
