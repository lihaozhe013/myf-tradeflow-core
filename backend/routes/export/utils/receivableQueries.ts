import { prisma } from "@/prismaClient.js";
import decimalCalc from "@/utils/decimalCalculator.js";

export default class ReceivableQueries {
  async getReceivableSummary(filters: any = {}): Promise<any[]> {
    try {
      let sql = `
        SELECT 
          o.customer_code,
          o.customer_short_name,
          o.customer_full_name,
          COALESCE(SUM(o.total_price), 0) as total_sales,
          COALESCE(SUM(p.amount), 0) as total_payments,
          COALESCE(SUM(o.total_price), 0) - COALESCE(SUM(p.amount), 0) as balance
        FROM outbound_records o
        LEFT JOIN receivable_payments p ON o.customer_code = p.customer_code
      `;
      const conditions: string[] = ["1=1"];
      const params: any[] = [];
      if (filters.outboundFrom) {
        conditions.push("o.outbound_date >= ?");
        params.push(filters.outboundFrom);
      }
      if (filters.outboundTo) {
        conditions.push("o.outbound_date <= ?");
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
        " GROUP BY o.customer_code, o.customer_short_name, o.customer_full_name";
      sql += " ORDER BY balance DESC";
      
      const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
      
      const processed = rows.map((row) => {
        const totalSales = decimalCalc.fromSqlResult(row.total_sales, 0);
        const totalPayments = decimalCalc.fromSqlResult(
          row.total_payments,
          0
        );
        const balance = decimalCalc.calculateBalance(
          totalSales,
          totalPayments
        );
        return {
          ...row,
          total_sales: totalSales,
          total_payments: totalPayments,
          balance,
        };
      });
      return processed;
    } catch (error) {
      throw error;
    }
  }

  async getReceivableDetails(filters: any = {}): Promise<any[]> {
    try {
      const where: any = {};
      if (filters.outboundFrom) {
        where.outbound_date = { ...where.outbound_date, gte: filters.outboundFrom };
      }
      if (filters.outboundTo) {
        where.outbound_date = { ...where.outbound_date, lte: filters.outboundTo };
      }

      const rows = await prisma.outboundRecord.findMany({
        where,
        select: {
          id: true,
          customer_code: true,
          customer_short_name: true,
          product_model: true,
          total_price: true,
          outbound_date: true,
          remark: true,
        },
        orderBy: [
            { outbound_date: 'desc' },
            { id: 'desc' }
        ]
      });
      return rows.map(r => ({ ...r, record_id: r.id }));
    } catch (error) {
      throw error;
    }
  }

  async getReceivablePayments(filters: any = {}): Promise<any[]> {
    try {
      const where: any = {};
      if (filters.paymentFrom) {
        where.pay_date = { ...where.pay_date, gte: filters.paymentFrom };
      }
      if (filters.paymentTo) {
        where.pay_date = { ...where.pay_date, lte: filters.paymentTo };
      }
      
      const rows = await prisma.receivablePayment.findMany({
        where,
        select: {
          id: true,
          customer_code: true,
          amount: true,
          pay_date: true,
          pay_method: true,
          remark: true,
        },
        orderBy: [
            { pay_date: 'desc' },
            { id: 'desc' }
        ]
      });
      return rows;
    } catch (error) {
      throw error;
    }
  }
}
