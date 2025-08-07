// 发票导出器
const XLSX = require('xlsx');

class InvoiceExporter {
  constructor(templates) {
    this.templates = templates;
  }

  /**
   * 导出发票明细
   * @param {Array} data - 发票数据
   * @param {Object} options - 导出选项
   * @returns {Buffer} Excel文件Buffer
   */
  exportInvoice(data, options = {}) {
    const workbook = XLSX.utils.book_new();
    
    if (data && data.length > 0) {
      const worksheet = this.createWorksheet(data, this.templates.invoice);
      XLSX.utils.book_append_sheet(workbook, worksheet, this.templates.invoice.sheetName);
    } else {
      // 如果没有数据，创建一个空的工作表
      const worksheet = this.createWorksheet([], this.templates.invoice);
      XLSX.utils.book_append_sheet(workbook, worksheet, this.templates.invoice.sheetName);
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

module.exports = InvoiceExporter;
