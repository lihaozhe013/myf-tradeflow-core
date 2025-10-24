import * as XLSX from "xlsx";
import ExportUtils from "@/routes/export/utils/exportUtils";

export default class AnalysisExporter {
  private templates: any;
  constructor(templates: any) {
    this.templates = templates;
  }

  exportAnalysis(options: any = {}): Buffer {
    const {
      analysisData,
      detailData,
      startDate,
      endDate,
      customerCode,
      productModel,
    } = options || {};
    const workbook = XLSX.utils.book_new();

    if (analysisData) {
      const summaryData = [
        {
          metric_name: "销售额",
          amount: `¥${Number(analysisData.sales_amount || 0).toLocaleString(
            "zh-CN",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`,
          remark: `时间: ${startDate} 至 ${endDate}`,
        },
        {
          metric_name: "成本",
          amount: `¥${Number(analysisData.cost_amount || 0).toLocaleString(
            "zh-CN",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`,
          remark: `客户: ${customerCode || "全部"}, 产品: ${
            productModel || "全部"
          }`,
        },
        {
          metric_name: "利润",
          amount: `¥${Number(analysisData.profit_amount || 0).toLocaleString(
            "zh-CN",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`,
          remark: `更新时间: ${analysisData.last_updated || ""}`,
        },
        {
          metric_name: "利润率",
          amount: `${Number(analysisData.profit_rate || 0).toFixed(2)}%`,
          remark: "基于加权平均成本法计算",
        },
      ];
      const summaryWorksheet = ExportUtils.createWorksheet(
        summaryData,
        this.templates.analysis_summary
      );
      XLSX.utils.book_append_sheet(
        workbook,
        summaryWorksheet,
        this.templates.analysis_summary.sheetName
      );
    }

    if (detailData && detailData.length > 0) {
      const hasSpecificCustomer = customerCode && customerCode !== "ALL";
      const hasSpecificProduct = productModel && productModel !== "ALL";
      let template: any, formattedDetailData: any[];
      if (hasSpecificCustomer && !hasSpecificProduct) {
        template = this.templates.analysis_detail_by_product;
        formattedDetailData = detailData.map((item: any) => ({
          product_model: item.product_model || "",
          sales_amount: `¥${Number(item.sales_amount || 0).toLocaleString(
            "zh-CN",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`,
          cost_amount: `¥${Number(item.cost_amount || 0).toLocaleString(
            "zh-CN",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`,
          profit_amount: `¥${Number(item.profit_amount || 0).toLocaleString(
            "zh-CN",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`,
          profit_rate: `${Number(item.profit_rate || 0).toFixed(2)}%`,
        }));
      } else if (!hasSpecificCustomer && hasSpecificProduct) {
        template = this.templates.analysis_detail_by_customer;
        formattedDetailData = detailData.map((item: any) => ({
          customer_code: item.customer_code || "",
          customer_name: item.customer_name || "",
          sales_amount: `¥${Number(item.sales_amount || 0).toLocaleString(
            "zh-CN",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`,
          cost_amount: `¥${Number(item.cost_amount || 0).toLocaleString(
            "zh-CN",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`,
          profit_amount: `¥${Number(item.profit_amount || 0).toLocaleString(
            "zh-CN",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`,
          profit_rate: `${Number(item.profit_rate || 0).toFixed(2)}%`,
        }));
      } else {
        template = this.templates.analysis_detail;
        formattedDetailData = detailData.map((item: any) => ({
          customer_code: item.customer_code || "",
          customer_name: item.customer_name || "",
          product_model: item.product_model || "",
          sales_amount: `¥${Number(item.sales_amount || 0).toLocaleString(
            "zh-CN",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`,
          cost_amount: `¥${Number(item.cost_amount || 0).toLocaleString(
            "zh-CN",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`,
          profit_amount: `¥${Number(item.profit_amount || 0).toLocaleString(
            "zh-CN",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`,
          profit_rate: `${Number(item.profit_rate || 0).toFixed(2)}%`,
        }));
      }
      const detailWorksheet = ExportUtils.createWorksheet(
        formattedDetailData,
        template
      );
      XLSX.utils.book_append_sheet(
        workbook,
        detailWorksheet,
        template.sheetName
      );
    }

    return XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    }) as unknown as Buffer;
  }
}
