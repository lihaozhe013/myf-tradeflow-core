import db from '@/db';
import decimalCalc from '@/utils/decimalCalculator';
import { calculateFilteredSoldGoodsCost } from '@/routes/analysis/utils/costCalculator';
import type { DetailItem } from '@/routes/analysis/utils/types';

/**
 * 计算详细分析数据（按客户或产品分组）
 */
export function calculateDetailAnalysis(
  startDate: string,
  endDate: string,
  customerCode: string | null | undefined,
  productModel: string | null | undefined,
  callback: (err: Error | null, detailData?: DetailItem[]) => void
): void {
  // 确定分组类型
  const groupByCustomer = !customerCode || customerCode === 'All';
  const groupByProduct = !productModel || productModel === 'All';

  // 如果两个都是All或都不是All，不需要详细分析
  if ((groupByCustomer && groupByProduct) || (!groupByCustomer && !groupByProduct)) {
    callback(null, []);
    return;
  }

  let groupField: 'customer_code' | 'product_model';
  let filterField: 'customer_code' | 'product_model';
  let filterValue: string | null | undefined;

  if (groupByCustomer) {
    groupField = 'customer_code';
    filterField = 'product_model';
    filterValue = productModel;
  } else {
    groupField = 'product_model';
    filterField = 'customer_code';
    filterValue = customerCode;
  }

  // 1. 获取所有相关的出库记录
  const outboundSql = `
    SELECT 
      ${groupField} as group_key,
      product_model,
      customer_code,
      SUM(CASE WHEN unit_price >= 0 THEN quantity * unit_price ELSE 0 END) as normal_sales,
      SUM(CASE WHEN unit_price < 0 THEN ABS(quantity * unit_price) ELSE 0 END) as special_expense
    FROM outbound_records 
    WHERE date(outbound_date) BETWEEN ? AND ?
      AND ${filterField} = ?
    GROUP BY ${groupField}
    HAVING normal_sales > 0 OR special_expense > 0
  `;

  db.all(outboundSql, [startDate, endDate, filterValue], (err: Error | null, outboundGroups: any[]) => {
    if (err) return callback(err);

    if (!outboundGroups || outboundGroups.length === 0) {
      callback(null, []);
      return;
    }

    // 2. 获取所有产品的平均成本（保持与原逻辑一致）
    db.all(
      `
      SELECT 
        product_model,
        SUM(quantity * unit_price) / SUM(quantity) as avg_cost_price,
        SUM(quantity) as total_inbound_quantity
      FROM inbound_records 
      WHERE unit_price >= 0
      GROUP BY product_model
    `,
      [],
      (err2: Error | null, avgCostData: any[]) => {
        if (err2) return callback(err2);

        const avgCostMap: Record<string, { avg_cost_price: number; total_inbound_quantity: number }> = {};
        avgCostData.forEach((item: any) => {
          avgCostMap[item.product_model] = {
            avg_cost_price: decimalCalc.fromSqlResult(item.avg_cost_price, 0, 4),
            total_inbound_quantity: decimalCalc.fromSqlResult(item.total_inbound_quantity, 0, 0)
          };
        });

        // 3. 计算每个分组的详细数据
        const detailPromises = outboundGroups.map((group: any) => {
          return new Promise<DetailItem | null>((resolve, reject) => {
            const groupKey = group.group_key as string;
            const currentCustomerCode = groupByCustomer ? groupKey : customerCode;
            const currentProductModel = groupByProduct ? groupKey : productModel;

            // 计算该分组的成本
            calculateFilteredSoldGoodsCost(
              startDate,
              endDate,
              currentCustomerCode === 'All' ? null : currentCustomerCode,
              currentProductModel === 'All' ? null : currentProductModel,
              (costErr, costAmount) => {
                if (costErr) return reject(costErr);

                const normalSales = decimalCalc.fromSqlResult(group.normal_sales, 0, 2);
                const specialExpense = decimalCalc.fromSqlResult(group.special_expense, 0, 2);
                const salesAmount = decimalCalc.toDbNumber(decimalCalc.subtract(normalSales, specialExpense), 2);
                const cost = decimalCalc.toDbNumber(costAmount ?? 0, 2);
                const profit = decimalCalc.toDbNumber(decimalCalc.subtract(salesAmount, cost), 2);

                // 计算利润率
                let profitRate = 0;
                if (salesAmount > 0) {
                  const rate = decimalCalc.multiply(decimalCalc.divide(profit, salesAmount), 100);
                  profitRate = decimalCalc.toDbNumber(rate, 2);
                }

                if (salesAmount > 0) {
                  resolve({
                    group_key: groupKey,
                    customer_code: currentCustomerCode ?? undefined,
                    product_model: currentProductModel ?? undefined,
                    sales_amount: salesAmount,
                    cost_amount: cost,
                    profit_amount: profit,
                    profit_rate: profitRate
                  });
                } else {
                  resolve(null);
                }
              }
            );
          });
        });

        Promise.all(detailPromises)
          .then((results) => {
            const validResults = results.filter((item): item is DetailItem => item !== null);
            callback(null, validResults);
          })
          .catch((e) => callback(e as Error));
      }
    );
  });
}
