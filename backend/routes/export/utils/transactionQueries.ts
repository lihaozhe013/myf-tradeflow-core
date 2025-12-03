import db from "@/db";

export default class TransactionQueries {
  async getInboundOutboundData(filters: any = {}): Promise<any> {
    const {
      tables = "12",
      dateFrom,
      dateTo,
      productCode,
      customerCode,
    } = filters || {};
    const result: any = {};
    if (tables.includes("1")) {
      result.inbound = await this.getInboundData({
        dateFrom,
        dateTo,
        productCode,
        customerCode,
      });
    }
    if (tables.includes("2")) {
      result.outbound = await this.getOutboundData({
        dateFrom,
        dateTo,
        productCode,
        customerCode,
      });
    }
    return result;
  }

  getInboundData(filters: any = {}): Promise<any[]> {
    try {
      let sql = `
        SELECT id, supplier_code, supplier_short_name, supplier_full_name,
               product_code, product_model, quantity, unit_price, total_price,
               inbound_date, invoice_date, invoice_number, receipt_number, order_number, remark
        FROM inbound_records 
        WHERE 1=1
      `;
      const params: any[] = [];
      if (filters.dateFrom) {
        sql += " AND inbound_date >= ?";
        params.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        sql += " AND inbound_date <= ?";
        params.push(filters.dateTo);
      }
      if (filters.productCode) {
        sql += " AND (product_code LIKE ? OR product_model LIKE ?)";
        params.push(`%${filters.productCode}%`, `%${filters.productCode}%`);
      }
      if (filters.customerCode) {
        sql += " AND (supplier_code LIKE ? OR supplier_short_name LIKE ?)";
        params.push(`%${filters.customerCode}%`, `%${filters.customerCode}%`);
      }
      sql += " ORDER BY inbound_date DESC, id DESC";
      const rows = db.prepare(sql).all(...params) as any[];
      return Promise.resolve(rows);
    } catch (error) {
      return Promise.reject(error as Error);
    }
  }

  getOutboundData(filters: any = {}): Promise<any[]> {
    try {
      let sql = `
        SELECT id, customer_code, customer_short_name, customer_full_name,
               product_code, product_model, quantity, unit_price, total_price,
               outbound_date, invoice_date, invoice_number, receipt_number, order_number, remark
        FROM outbound_records 
        WHERE 1=1
      `;
      const params: any[] = [];
      if (filters.dateFrom) {
        sql += " AND outbound_date >= ?";
        params.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        sql += " AND outbound_date <= ?";
        params.push(filters.dateTo);
      }
      if (filters.productCode) {
        sql += " AND (product_code LIKE ? OR product_model LIKE ?)";
        params.push(`%${filters.productCode}%`, `%${filters.productCode}%`);
      }
      if (filters.customerCode) {
        sql += " AND (customer_code LIKE ? OR customer_short_name LIKE ?)";
        params.push(`%${filters.customerCode}%`, `%${filters.customerCode}%`);
      }
      sql += " ORDER BY outbound_date DESC, id DESC";
      const rows = db.prepare(sql).all(...params) as any[];
      return Promise.resolve(rows);
    } catch (error) {
      return Promise.reject(error as Error);
    }
  }
}
