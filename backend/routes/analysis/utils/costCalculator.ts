import { prisma } from "@/prismaClient.js";
import decimalCalc from "@/utils/decimalCalculator.js";

/**
 * Calculate the actual cost of goods sold under specified conditions (using the weighted average cost method)
 */
export function calculateFilteredSoldGoodsCost(
  startDate: string,
  endDate: string,
  customerCode: string | null | undefined,
  productModel: string | null | undefined,
  callback: (err: Error | null, totalCost?: number) => void
): void {
  (async () => {
    // Build query conditions
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

    // Add time interval conditions
    whereConditions.push('date(outbound_date) BETWEEN ? AND ?');
    params.push(startDate, endDate);

    // Calculate the weighted average purchase price for each product (across the entire time range, using only positive unit prices)
    try {
      const avgCostData = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          product_model,
          SUM(quantity * unit_price) / SUM(quantity) as avg_cost_price,
          SUM(quantity) as total_inbound_quantity
        FROM inbound_records 
        WHERE unit_price >= 0
        GROUP BY product_model
      `);

      // Converting to a Map facilitates lookup operations
      const avgCostMap: Record<string, { avg_cost_price: number; total_inbound_quantity: number }> = {};
      avgCostData.forEach((item: any) => {
        avgCostMap[item.product_model] = {
          avg_cost_price: decimalCalc.fromSqlResult(item.avg_cost_price, 0, 4),
          total_inbound_quantity: decimalCalc.fromSqlResult(item.total_inbound_quantity, 0, 0)
        };
      });

      // Retrieve outbound records meeting specified conditions
      const outboundSql = `
        SELECT product_model, quantity, unit_price as selling_price
        FROM outbound_records
        WHERE ${whereConditions.join(' AND ')}
      `;

      const outboundRecords = await prisma.$queryRawUnsafe<any[]>(outboundSql, ...params);

      if (!outboundRecords || outboundRecords.length === 0) {
        callback(null, 0);
        return;
      }

      let totalSoldGoodsCost = decimalCalc.decimal(0);

      // Calculate the cost of each sales record using the average cost method
      outboundRecords.forEach((outRecord: any) => {
        const prodModel = outRecord.product_model;
        const soldQuantity = decimalCalc.decimal(outRecord.quantity);

        if (avgCostMap[prodModel]) {
          const avgCost = avgCostMap[prodModel].avg_cost_price;
          const recordCost = decimalCalc.multiply(soldQuantity, avgCost);
          totalSoldGoodsCost = decimalCalc.add(totalSoldGoodsCost, recordCost);
        } else {
          // If there is no inventory receipt record, use the issue price as the cost (conservative estimate)
          const sellingPrice = decimalCalc.fromSqlResult(outRecord.selling_price, 0, 4);
          const recordCost = decimalCalc.multiply(soldQuantity, sellingPrice);
          totalSoldGoodsCost = decimalCalc.add(totalSoldGoodsCost, recordCost);
        }
      });

      // Calculate the special income from goods with negative unit prices under specified conditions when entering inventory, thereby reducing total costs
      const specialIncomeConditions: string[] = ['unit_price < 0'];
      const specialIncomeParams: any[] = [];

      if (productModel && productModel !== 'All') {
        specialIncomeConditions.push('product_model = ?');
        specialIncomeParams.push(productModel);
      }

      // Special income is also calculated by time period
      specialIncomeConditions.push('date(inbound_date) BETWEEN ? AND ?');
      specialIncomeParams.push(startDate, endDate);

      const specialIncomeSql = `
        SELECT COALESCE(SUM(ABS(quantity * unit_price)), 0) as special_income
        FROM inbound_records 
        WHERE ${specialIncomeConditions.join(' AND ')}
      `;

      const result = await prisma.$queryRawUnsafe<any[]>(specialIncomeSql, ...specialIncomeParams);
      const specialIncomeRow = result[0];
      const specialIncome = decimalCalc.fromSqlResult(specialIncomeRow?.special_income, 0, 2);
      const finalCost = decimalCalc.subtract(totalSoldGoodsCost, specialIncome);
      // Ensure that costs are not negative and retain two decimal places
      const finalResult = decimalCalc.toDbNumber(decimalCalc.decimal(Math.max(0, (finalCost as any).toNumber?.() ?? Number(finalCost))), 2);
      callback(null, finalResult);
    } catch (err) {
      callback(err as Error);
    }
  })();
}
