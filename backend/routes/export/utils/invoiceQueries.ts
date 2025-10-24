import db from "@/db";

export default class InvoiceQueries {
  async getInvoiceData(filters: any = {}): Promise<any[]> {
    const { partnerCode, dateFrom, dateTo } = filters || {};
    if (!partnerCode) throw new Error("Partner Code is required");
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          product_model,
          unit_price,
          SUM(quantity) as quantity,
          SUM(total_price) as total_price
        FROM (
          SELECT 
            product_model,
            unit_price,
            quantity,
            total_price
          FROM inbound_records 
          WHERE (supplier_code = ? OR supplier_short_name = ?)
          ${dateFrom ? "AND inbound_date >= ?" : ""}
          ${dateTo ? "AND inbound_date <= ?" : ""}
          UNION ALL
          SELECT 
            product_model,
            unit_price,
            quantity,
            total_price
          FROM outbound_records 
          WHERE (customer_code = ? OR customer_short_name = ?)
          ${dateFrom ? "AND outbound_date >= ?" : ""}
          ${dateTo ? "AND outbound_date <= ?" : ""}
        ) as combined_records
        GROUP BY product_model, unit_price
        ORDER BY product_model, unit_price
      `;
      const params: any[] = [partnerCode, partnerCode];
      if (dateFrom) params.push(dateFrom);
      if (dateTo) params.push(dateTo);
      params.push(partnerCode, partnerCode);
      if (dateFrom) params.push(dateFrom);
      if (dateTo) params.push(dateTo);
      db.all(sql, params, (err: any, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}
