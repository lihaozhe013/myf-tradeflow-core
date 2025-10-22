import db from '@/db';
import decimalCalc from '@/utils/decimalCalculator';

/**
 * 计算指定条件下已售商品的真实成本（加权平均成本法）
 */
export function calculateFilteredSoldGoodsCost(
  startDate: string,
  endDate: string,
  customerCode: string | null | undefined,
  productModel: string | null | undefined,
  callback: (err: Error | null, totalCost?: number) => void
): void {
  // 1. 构建查询条件
  const whereConditions: string[] = ['unit_price >= 0'];
  const params: any[] = [];

  if (customerCode && customerCode !== 'All') {
    whereConditions.push('customer_code = ?');
    params.push(customerCode);
  }

  if (productModel && productModel !== 'All') {
    whereConditions.push('product_model = ?');
    params.push(productModel);
  }

  // 添加时间区间条件
  whereConditions.push('date(outbound_date) BETWEEN ? AND ?');
  params.push(startDate, endDate);

  // 2. 计算每个产品的加权平均入库价格（全时间范围，只计算正数单价）
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
    (err: Error | null, avgCostData: any[]) => {
      if (err) return callback(err);

      // 转换为Map便于查找，使用 decimal.js 处理数据
      const avgCostMap: Record<string, { avg_cost_price: number; total_inbound_quantity: number }> = {};
      avgCostData.forEach((item: any) => {
        avgCostMap[item.product_model] = {
          avg_cost_price: decimalCalc.fromSqlResult(item.avg_cost_price, 0, 4),
          total_inbound_quantity: decimalCalc.fromSqlResult(item.total_inbound_quantity, 0, 0)
        };
      });

      // 3. 获取指定条件的出库记录
      const outboundSql = `
        SELECT product_model, quantity, unit_price as selling_price
        FROM outbound_records
        WHERE ${whereConditions.join(' AND ')}
      `;

      db.all(outboundSql, params, (err2: Error | null, outboundRecords: any[]) => {
        if (err2) return callback(err2);

        if (!outboundRecords || outboundRecords.length === 0) {
          callback(null, 0);
          return;
        }

        let totalSoldGoodsCost = decimalCalc.decimal(0);

        // 4. 使用平均成本计算每个销售记录的成本
        outboundRecords.forEach((outRecord: any) => {
          const prodModel = outRecord.product_model;
          const soldQuantity = decimalCalc.decimal(outRecord.quantity);

          if (avgCostMap[prodModel]) {
            const avgCost = avgCostMap[prodModel].avg_cost_price;
            const recordCost = decimalCalc.multiply(soldQuantity, avgCost);
            totalSoldGoodsCost = decimalCalc.add(totalSoldGoodsCost, recordCost);
          } else {
            // 如果没有入库记录，使用出库价格作为成本（保守估计）
            const sellingPrice = decimalCalc.fromSqlResult(outRecord.selling_price, 0, 4);
            const recordCost = decimalCalc.multiply(soldQuantity, sellingPrice);
            totalSoldGoodsCost = decimalCalc.add(totalSoldGoodsCost, recordCost);
          }
        });

        // 5. 计算指定条件下入库负数单价商品的特殊收入，减少总成本
        const specialIncomeConditions: string[] = ['unit_price < 0'];
        const specialIncomeParams: any[] = [];

        if (productModel && productModel !== 'All') {
          specialIncomeConditions.push('product_model = ?');
          specialIncomeParams.push(productModel);
        }

        // 特殊收入也按时间区间计算
        specialIncomeConditions.push('date(inbound_date) BETWEEN ? AND ?');
        specialIncomeParams.push(startDate, endDate);

        const specialIncomeSql = `
          SELECT COALESCE(SUM(ABS(quantity * unit_price)), 0) as special_income
          FROM inbound_records 
          WHERE ${specialIncomeConditions.join(' AND ')}
        `;

        db.get(specialIncomeSql, specialIncomeParams, (err3: Error | null, specialIncomeRow: any) => {
          if (err3) return callback(err3);

          const specialIncome = decimalCalc.fromSqlResult(specialIncomeRow?.special_income, 0, 2);
          const finalCost = decimalCalc.subtract(totalSoldGoodsCost, specialIncome);

          // 确保成本不为负数并保留两位小数
          const result = decimalCalc.toDbNumber(decimalCalc.decimal(Math.max(0, (finalCost as any).toNumber?.() ?? Number(finalCost))), 2);
          callback(null, result);
        });
      });
    }
  );
}
