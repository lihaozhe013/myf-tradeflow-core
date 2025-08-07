// 基础信息导出器
const XLSX = require('xlsx');

class BaseInfoExporter {
  constructor(templates) {
    this.templates = templates;
  }

  /**
   * 导出基础信息
   * @param {Object} data - 数据对象
   * @param {Object} options - 导出选项
   * @returns {Buffer} Excel文件Buffer
   */
  export(data, options = {}) {
    const { tables = '123' } = options;
    const workbook = XLSX.utils.book_new();
    
    // 1: 客户供应商
    if (tables.includes('1') && data.partners) {
      const worksheet = this.createWorksheet(data.partners, this.templates.partners);
      XLSX.utils.book_append_sheet(workbook, worksheet, this.templates.partners.sheetName);
    }
    
    // 2: 产品信息
    if (tables.includes('2') && data.products) {
      const worksheet = this.createWorksheet(data.products, this.templates.products);
      XLSX.utils.book_append_sheet(workbook, worksheet, this.templates.products.sheetName);
    }
    
    // 3: 产品价格
    if (tables.includes('3') && data.prices) {
      const worksheet = this.createWorksheet(data.prices, this.templates.prices);
      XLSX.utils.book_append_sheet(workbook, worksheet, this.templates.prices.sheetName);
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

module.exports = BaseInfoExporter;
