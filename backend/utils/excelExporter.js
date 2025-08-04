// Excel导出核心类
const XLSX = require('xlsx');
const { TEMPLATES } = require('./exportTemplates');
const ExportQueries = require('./exportQueries');

class ExcelExporter {
  constructor() {
    this.queries = new ExportQueries();
  }

  /**
   * 导出基础信息
   * @param {Object} options - 导出选项
   * @param {string} options.tables - 要导出的表格，如 '123'
   * @returns {Promise<Buffer>} Excel文件Buffer
   */
  async exportBaseInfo(options = {}) {
    try {
      const { tables = '123' } = options;
      const data = await this.queries.getBaseInfoData(tables);
      
      const workbook = XLSX.utils.book_new();
      
      // 1: 客户供应商
      if (tables.includes('1') && data.partners) {
        const worksheet = this.createWorksheet(data.partners, TEMPLATES.partners);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.partners.sheetName);
      }
      
      // 2: 产品信息
      if (tables.includes('2') && data.products) {
        const worksheet = this.createWorksheet(data.products, TEMPLATES.products);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.products.sheetName);
      }
      
      // 3: 产品价格
      if (tables.includes('3') && data.prices) {
        const worksheet = this.createWorksheet(data.prices, TEMPLATES.prices);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.prices.sheetName);
      }
      
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    } catch (error) {
      throw new Error(`基础信息导出失败: ${error.message}`);
    }
  }

  /**
   * 导出入库出库记录
   * @param {Object} options - 导出选项
   * @returns {Promise<Buffer>} Excel文件Buffer
   */
  async exportInboundOutbound(options = {}) {
    try {
      const data = await this.queries.getInboundOutboundData(options);
      
      const workbook = XLSX.utils.book_new();
      
      // 1: 入库记录
      if (options.tables?.includes('1') && data.inbound) {
        const worksheet = this.createWorksheet(data.inbound, TEMPLATES.inbound);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.inbound.sheetName);
      }
      
      // 2: 出库记录
      if (options.tables?.includes('2') && data.outbound) {
        const worksheet = this.createWorksheet(data.outbound, TEMPLATES.outbound);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.outbound.sheetName);
      }
      
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    } catch (error) {
      throw new Error(`入库出库记录导出失败: ${error.message}`);
    }
  }

  /**
   * 导出应收应付明细
   * @param {Object} options - 导出选项
   * @returns {Promise<Buffer>} Excel文件Buffer
   */
  async exportReceivablePayable(options = {}) {
    try {
      const data = await this.queries.getReceivablePayableData(options);
      
      const workbook = XLSX.utils.book_new();
      
      // 应收账款汇总
      if (data.receivable_summary && data.receivable_summary.length > 0) {
        const worksheet = this.createWorksheet(data.receivable_summary, TEMPLATES.receivable_summary);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.receivable_summary.sheetName);
      }
      
      // 应收明细
      if (data.receivable_details && data.receivable_details.length > 0) {
        const worksheet = this.createWorksheet(data.receivable_details, TEMPLATES.receivable_details);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.receivable_details.sheetName);
      }
      
      // 回款记录
      if (data.receivable_payments && data.receivable_payments.length > 0) {
        const worksheet = this.createWorksheet(data.receivable_payments, TEMPLATES.receivable_payments);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.receivable_payments.sheetName);
      }
      
      // 应付账款汇总
      if (data.payable_summary && data.payable_summary.length > 0) {
        const worksheet = this.createWorksheet(data.payable_summary, TEMPLATES.payable_summary);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.payable_summary.sheetName);
      }
      
      // 应付明细
      if (data.payable_details && data.payable_details.length > 0) {
        const worksheet = this.createWorksheet(data.payable_details, TEMPLATES.payable_details);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.payable_details.sheetName);
      }
      
      // 付款记录
      if (data.payable_payments && data.payable_payments.length > 0) {
        const worksheet = this.createWorksheet(data.payable_payments, TEMPLATES.payable_payments);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.payable_payments.sheetName);
      }
      
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    } catch (error) {
      throw new Error(`应收应付明细导出失败: ${error.message}`);
    }
  }

  /**
   * 导出对账单
   * @param {Object} options - 导出选项
   * @returns {Promise<Buffer>} Excel文件Buffer
   */
  async exportStatement(options = {}) {
    try {
      const data = await this.queries.getInboundOutboundData(options);
      
      const workbook = XLSX.utils.book_new();
      
      // 1: 入库记录（对账单格式）
      if (options.tables?.includes('1') && data.inbound) {
        const worksheet = this.createWorksheet(data.inbound, TEMPLATES.inbound_statement);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.inbound_statement.sheetName);
      }
      
      // 2: 出库记录（对账单格式）
      if (options.tables?.includes('2') && data.outbound) {
        const worksheet = this.createWorksheet(data.outbound, TEMPLATES.outbound_statement);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.outbound_statement.sheetName);
      }
      
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    } catch (error) {
      throw new Error(`对账单导出失败: ${error.message}`);
    }
  }

  /**
   * 导出发票明细
   * @param {Object} options - 导出选项
   * @param {string} options.partnerCode - 合作伙伴代号（必填）
   * @param {string} options.dateFrom - 开始日期
   * @param {string} options.dateTo - 结束日期
   * @returns {Promise<Buffer>} Excel文件Buffer
   */
  async exportInvoice(options = {}) {
    try {
      const { partnerCode, dateFrom, dateTo } = options;
      
      if (!partnerCode) {
        throw new Error('合作伙伴代号是必填项');
      }
      
      const data = await this.queries.getInvoiceData({
        partnerCode,
        dateFrom,
        dateTo
      });
      
      const workbook = XLSX.utils.book_new();
      
      if (data && data.length > 0) {
        const worksheet = this.createWorksheet(data, TEMPLATES.invoice);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.invoice.sheetName);
      } else {
        // 如果没有数据，创建一个空的工作表
        const worksheet = this.createWorksheet([], TEMPLATES.invoice);
        XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATES.invoice.sheetName);
      }
      
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    } catch (error) {
      throw new Error(`发票导出失败: ${error.message}`);
    }
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

  /**
   * 生成文件名
   * @param {string} exportType - 导出类型
   * @returns {string} 文件名
   */
  generateFilename(exportType) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const typeMap = {
      'base-info': '基础信息导出',
      'inbound-outbound': '入库出库记录导出',
      'receivable-payable': '应收应付明细导出',
      'invoice': '发票导出',
      'statement': '对账单导出'
    };
    const typeName = typeMap[exportType] || exportType;
    return `${typeName}_${timestamp}.xlsx`;
  }
}

module.exports = ExcelExporter;
