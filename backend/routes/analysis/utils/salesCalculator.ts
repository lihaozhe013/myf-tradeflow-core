import db from '@/db';
import decimalCalc from '@/utils/decimalCalculator';
import type { SalesData } from '@/routes/analysis/utils/types';

/**
 * 计算销售额数据
 */
export function calculateSalesData(
  startDate: string,
  endDate: string,
  customerCode: string | null | undefined,
  productModel: string | null | undefined,
  callback: (err: Error | null, salesData?: SalesData) => void
): void {
  // 1. 构建销售额查询条件
  const salesSqlConditions: string[] = ['unit_price >= 0', 'date(outbound_date) BETWEEN ? AND ?'];
  const salesParams: any[] = [startDate, endDate];

  if (customerCode && customerCode !== 'All') {
    salesSqlConditions.push('customer_code = ?');
    salesParams.push(customerCode);
  }

  if (productModel && productModel !== 'All') {
    salesSqlConditions.push('product_model = ?');
    salesParams.push(productModel);
  }

  const salesSql = `
    SELECT 
      COALESCE(SUM(quantity * unit_price), 0) as normal_sales,
      COALESCE((
        SELECT SUM(ABS(quantity * unit_price)) 
        FROM outbound_records 
        WHERE unit_price < 0 
          AND date(outbound_date) BETWEEN ? AND ?
          ${customerCode && customerCode !== 'All' ? 'AND customer_code = ?' : ''}
          ${productModel && productModel !== 'All' ? 'AND product_model = ?' : ''}
      ), 0) as special_expense
    FROM outbound_records 
    WHERE ${salesSqlConditions.join(' AND ')}
  `;

  // 构建特殊支出查询的参数
  const specialExpenseParams: any[] = [startDate, endDate];
  if (customerCode && customerCode !== 'All') {
    specialExpenseParams.push(customerCode);
  }
  if (productModel && productModel !== 'All') {
    specialExpenseParams.push(productModel);
  }

  const finalSalesParams = [...salesParams, ...specialExpenseParams];

  db.get(salesSql, finalSalesParams, (err: Error | null, salesRow: any) => {
    if (err) {
      console.error('计算销售额失败:', err);
      callback(err);
      return;
    }

    const normalSales = decimalCalc.fromSqlResult(salesRow?.normal_sales, 0, 2);
    const specialExpense = decimalCalc.fromSqlResult(salesRow?.special_expense, 0, 2);
    const salesAmount = decimalCalc.toDbNumber(decimalCalc.subtract(normalSales, specialExpense), 2);

    callback(null, {
      normal_sales: normalSales,
      special_expense: specialExpense,
      sales_amount: salesAmount
    });
  });
}
