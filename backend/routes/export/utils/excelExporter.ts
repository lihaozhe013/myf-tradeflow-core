// Excel 导出核心类（TS + ESM）
import { TEMPLATES } from '@/routes/export/utils/exportTemplates';
import ExportQueries from '@/routes/export/utils';
import BaseInfoExporter from '@/routes/export/utils/baseInfoExporter';
import TransactionExporter from '@/routes/export/utils/transactionExporter';
import FinancialExporter from '@/routes/export/utils/financialExporter';
import AnalysisExporter from '@/routes/export/utils/analysisExporter';
import AdvancedAnalysisExporter from '@/routes/export/utils/advancedAnalysisExporter';
import InvoiceExporter from '@/routes/export/utils/invoiceExporter';
import ExportUtils from '@/routes/export/utils/exportUtils';

export default class ExcelExporter {
  private queries: ExportQueries;
  private baseInfoExporter: BaseInfoExporter;
  private transactionExporter: TransactionExporter;
  private financialExporter: FinancialExporter;
  private analysisExporter: AnalysisExporter;
  private advancedAnalysisExporter: AdvancedAnalysisExporter;
  private invoiceExporter: InvoiceExporter;

  constructor() {
    this.queries = new ExportQueries();
    this.baseInfoExporter = new BaseInfoExporter(TEMPLATES as any);
    this.transactionExporter = new TransactionExporter(TEMPLATES as any);
    this.financialExporter = new FinancialExporter(TEMPLATES as any);
    this.analysisExporter = new AnalysisExporter(TEMPLATES as any);
    this.advancedAnalysisExporter = new AdvancedAnalysisExporter(TEMPLATES as any, this.queries);
    this.invoiceExporter = new InvoiceExporter(TEMPLATES as any);
  }

  async exportBaseInfo(options: any = {}): Promise<Buffer> {
    try {
      const data = await this.queries.getBaseInfoData(options.tables || '123');
      return this.baseInfoExporter.export(data, options);
    } catch (error: any) {
      throw new Error(`基础信息导出失败: ${error.message}`);
    }
  }

  async exportInboundOutbound(options: any = {}): Promise<Buffer> {
    try {
      const data = await this.queries.getInboundOutboundData(options);
      return this.transactionExporter.exportInboundOutbound(data, options);
    } catch (error: any) {
      throw new Error(`入库出库记录导出失败: ${error.message}`);
    }
  }

  async exportReceivablePayable(options: any = {}): Promise<Buffer> {
    try {
      const data = await this.queries.getReceivablePayableData(options);
      return this.financialExporter.exportReceivablePayable(data);
    } catch (error: any) {
      throw new Error(`应收应付明细导出失败: ${error.message}`);
    }
  }

  async exportStatement(options: any = {}): Promise<Buffer> {
    try {
      const data = await this.queries.getInboundOutboundData(options);
      return this.transactionExporter.exportStatement(data, options);
    } catch (error: any) {
      throw new Error(`对账单导出失败: ${error.message}`);
    }
  }

  async exportAnalysis(options: any = {}): Promise<Buffer> {
    try {
      return this.analysisExporter.exportAnalysis(options);
    } catch (error: any) {
      throw new Error(`分析数据导出失败: ${error.message}`);
    }
  }

  async exportAdvancedAnalysis(options: any = {}): Promise<Buffer> {
    try {
      return await this.advancedAnalysisExporter.exportAdvancedAnalysis(options);
    } catch (error: any) {
      throw new Error(`高级分析数据导出失败: ${error.message}`);
    }
  }

  async exportInvoice(options: any = {}): Promise<Buffer> {
    try {
      const { partnerCode, dateFrom, dateTo } = options || {};
      if (!partnerCode) throw new Error('合作伙伴代号是必填项');
      const data = await this.queries.getInvoiceData({ partnerCode, dateFrom, dateTo });
      return this.invoiceExporter.exportInvoice(data, options);
    } catch (error: any) {
      throw new Error(`发票导出失败: ${error.message}`);
    }
  }

  createWorksheet(data: any[], template: any) {
    return ExportUtils.createWorksheet(data, template);
  }

  generateFilename(exportType: string) {
    return ExportUtils.generateFilename(exportType);
  }
}
