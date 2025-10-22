// 高级分析导出器（TS + ESM）
import * as XLSX from 'xlsx';
import ExportUtils from '@/routes/export/utils/exportUtils';

export default class AdvancedAnalysisExporter {
  private templates: any;
  private queries: any;
  constructor(templates: any, queries: any) {
    this.templates = templates;
    this.queries = queries;
  }

  async exportAdvancedAnalysis(options: any = {}): Promise<Buffer> {
    const { exportType, startDate, endDate } = options || {};
    if (!exportType || !['customer', 'product'].includes(exportType)) {
      throw new Error('导出类型必须是 customer 或 product');
    }
    const workbook = XLSX.utils.book_new();
    if (exportType === 'customer') {
      await this.createCustomerSheets(workbook, startDate, endDate);
    } else {
      await this.createProductSheets(workbook, startDate, endDate);
    }
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as unknown as Buffer;
  }

  private async createCustomerSheets(workbook: XLSX.WorkBook, startDate: string, endDate: string) {
    const customerData = await this.queries.getCustomerAnalysisData(startDate, endDate);
    for (const customer of customerData) {
      if (customer.sales_amount > 0) {
        const summaryData = [{
          customer_code: customer.customer_code,
          customer_name: customer.customer_name,
          sales_amount: `¥${Number(customer.sales_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          cost_amount: `¥${Number(customer.cost_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          profit_amount: `¥${Number(customer.profit_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          profit_rate: `${Number(customer.profit_rate || 0).toFixed(2)}%`
        }];
        const summaryWorksheet = ExportUtils.createWorksheet(summaryData, this.templates.analysis_customer_summary);
        const summarySheetName = `${customer.customer_name}-汇总`.substring(0, 30);
        XLSX.utils.book_append_sheet(workbook, summaryWorksheet, summarySheetName);

        if (customer.product_details && customer.product_details.length > 0) {
          const detailData = customer.product_details
            .filter((item: any) => item.sales_amount > 0)
            .map((item: any) => ({
              product_model: item.product_model,
              sales_amount: `¥${Number(item.sales_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              cost_amount: `¥${Number(item.cost_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              profit_amount: `¥${Number(item.profit_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              profit_rate: `${Number(item.profit_rate || 0).toFixed(2)}%`
            }));
          if (detailData.length > 0) {
            const detailWorksheet = ExportUtils.createWorksheet(detailData, this.templates.analysis_customer_detail);
            const detailSheetName = `${customer.customer_name}-明细`.substring(0, 30);
            XLSX.utils.book_append_sheet(workbook, detailWorksheet, detailSheetName);
          }
        }
      }
    }
  }

  private async createProductSheets(workbook: XLSX.WorkBook, startDate: string, endDate: string) {
    const productData = await this.queries.getProductAnalysisData(startDate, endDate);
    for (const product of productData) {
      if (product.sales_amount > 0) {
        const summaryData = [{
          product_model: product.product_model,
          sales_amount: `¥${Number(product.sales_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          cost_amount: `¥${Number(product.cost_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          profit_amount: `¥${Number(product.profit_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          profit_rate: `${Number(product.profit_rate || 0).toFixed(2)}%`
        }];
        const summaryWorksheet = ExportUtils.createWorksheet(summaryData, this.templates.analysis_product_summary);
        const summarySheetName = `${product.product_model}-汇总`.substring(0, 30);
        XLSX.utils.book_append_sheet(workbook, summaryWorksheet, summarySheetName);

        if (product.customer_details && product.customer_details.length > 0) {
          const detailData = product.customer_details
            .filter((item: any) => item.sales_amount > 0)
            .map((item: any) => ({
              customer_code: item.customer_code,
              customer_name: item.customer_name,
              sales_amount: `¥${Number(item.sales_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              cost_amount: `¥${Number(item.cost_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              profit_amount: `¥${Number(item.profit_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              profit_rate: `${Number(item.profit_rate || 0).toFixed(2)}%`
            }));
          if (detailData.length > 0) {
            const detailWorksheet = ExportUtils.createWorksheet(detailData, this.templates.analysis_product_detail);
            const detailSheetName = `${product.product_model}-明细`.substring(0, 30);
            XLSX.utils.book_append_sheet(workbook, detailWorksheet, detailSheetName);
          }
        }
      }
    }
  }
}
