import db from "@/db";
import decimalCalc from "@/utils/decimalCalculator";

export default class PayableQueries {
  getPayableSummary(filters: any = {}): Promise<any[]> {
    try {
      let sql = `
        SELECT 
          i.supplier_code,
          i.supplier_short_name,
          i.supplier_full_name,
          COALESCE(SUM(i.total_price), 0) as total_purchases,
          COALESCE(SUM(p.amount), 0) as total_payments,
          COALESCE(SUM(i.total_price), 0) - COALESCE(SUM(p.amount), 0) as balance
        FROM inbound_records i
        LEFT JOIN payable_payments p ON i.supplier_code = p.supplier_code
      `;
      const conditions: string[] = ["1=1"];
      const params: any[] = [];
      if (filters.outboundFrom) {
        conditions.push("i.inbound_date >= ?");
        params.push(filters.outboundFrom);
      }
      if (filters.outboundTo) {
        conditions.push("i.inbound_date <= ?");
        params.push(filters.outboundTo);
      }
      if (filters.paymentFrom) {
        conditions.push("(p.pay_date IS NULL OR p.pay_date >= ?)");
        params.push(filters.paymentFrom);
      }
      if (filters.paymentTo) {
        conditions.push("(p.pay_date IS NULL OR p.pay_date <= ?)");
        params.push(filters.paymentTo);
      }
      sql += " WHERE " + conditions.join(" AND ");
      sql +=
        " GROUP BY i.supplier_code, i.supplier_short_name, i.supplier_full_name";
      sql += " ORDER BY balance DESC";
      const rows = db.prepare(sql).all(...params) as any[];
      const processed = rows.map((row) => {
        const totalPurchases = decimalCalc.fromSqlResult(
          row.total_purchases,
          0
        );
        const totalPayments = decimalCalc.fromSqlResult(
          row.total_payments,
          0
        );
        const balance = decimalCalc.calculateBalance(
          totalPurchases,
          totalPayments
        );
        return {
          ...row,
          total_purchases: totalPurchases,
          total_payments: totalPayments,
          balance,
        };
      });
      return Promise.resolve(processed);
    } catch (error) {
      return Promise.reject(error as Error);
    }
  }

  getPayableDetails(filters: any = {}): Promise<any[]> {
    try {
      let sql = `
        SELECT id as record_id, supplier_code, supplier_short_name, 
               product_model, total_price, inbound_date, remark
        FROM inbound_records 
        WHERE 1=1
      `;
      const params: any[] = [];
      if (filters.outboundFrom) {
        sql += " AND inbound_date >= ?";
        params.push(filters.outboundFrom);
      }
      if (filters.outboundTo) {
        sql += " AND inbound_date <= ?";
        params.push(filters.outboundTo);
      }
      sql += " ORDER BY inbound_date DESC, id DESC";
      const rows = db.prepare(sql).all(...params) as any[];
      return Promise.resolve(rows);
    } catch (error) {
      return Promise.reject(error as Error);
    }
  }

  getPayablePayments(filters: any = {}): Promise<any[]> {
    try {
      let sql = `
        SELECT id, supplier_code, amount, pay_date, pay_method, remark
        FROM payable_payments 
        WHERE 1=1
      `;
      const params: any[] = [];
      if (filters.paymentFrom) {
        sql += " AND pay_date >= ?";
        params.push(filters.paymentFrom);
      }
      if (filters.paymentTo) {
        sql += " AND pay_date <= ?";
        params.push(filters.paymentTo);
      }
      sql += " ORDER BY pay_date DESC, id DESC";
      const rows = db.prepare(sql).all(...params) as any[];
      return Promise.resolve(rows);
    } catch (error) {
      return Promise.reject(error as Error);
    }
  }
}
