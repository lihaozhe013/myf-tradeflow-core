// 导出工具函数（TS + ESM）
import * as XLSX from 'xlsx';

export type ExportColumn = { key: string; label: string };
export type ExportTemplate = { sheetName: string; columns: ExportColumn[] };

export default class ExportUtils {
  /**
   * 生成文件名
   */
  static generateFilename(exportType: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const typeMap: Record<string, string> = {
      'base-info': '基础信息导出',
      'inbound-outbound': '入库出库记录导出',
      'receivable-payable': '应收应付明细导出',
      'invoice': '发票导出',
      'statement': '对账单导出',
      'analysis': '数据分析导出'
    };
    const typeName = typeMap[exportType] || exportType;
    return `${typeName}_${timestamp}.xlsx`;
  }

  /**
   * 创建工作表的通用方法
   */
  static createWorksheet(data: any[], template: ExportTemplate) {
    // 创建表头
    const headers = template.columns.map(col => col.label);

    // 创建数据行
    const rows = (data || []).map(item =>
      template.columns.map(col => {
        const value = (item as any)[col.key];
        if (typeof value === 'number') return value;
        return value != null ? String(value) : '';
      })
    );

    // 合并表头和数据
    const sheetData = [headers, ...rows];

    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // 设置列宽
    const colWidths = template.columns.map(col => {
      const labelWidth = col.label.length * 2;
      let dataWidth = 10;
      if (col.key.includes('date')) dataWidth = 12;
      else if (col.key.includes('price') || col.key.includes('amount')) dataWidth = 15;
      else if (col.key.includes('name') || col.key.includes('address')) dataWidth = 20;
      return { wch: Math.max(labelWidth, dataWidth) };
    });

    (worksheet as any)['!cols'] = colWidths;
    return worksheet;
  }
}
