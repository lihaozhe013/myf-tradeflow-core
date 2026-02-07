import { prisma } from "@/prismaClient.js";
import decimalCalc from "@/utils/decimalCalculator.js";
import type { SalesData } from "@/routes/analysis/utils/types.js";

export function calculateSalesData(
  startDate: string,
  endDate: string,
  customerCode: string | null | undefined,
  productModel: string | null | undefined,
  callback: (err: Error | null, salesData?: SalesData) => void
): void {
  (async () => {
    // Build Sales Query Conditions
    const salesSqlConditions: string[] = [
      "unit_price >= 0",
      "date(outbound_date) BETWEEN ? AND ?",
    ];
    const salesParams: any[] = [startDate, endDate];

    if (customerCode && customerCode !== "All") {
      salesSqlConditions.push("customer_code = ?");
      salesParams.push(customerCode);
    }

    if (productModel && productModel !== "All") {
      salesSqlConditions.push("product_model = ?");
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
            ${
              customerCode && customerCode !== "All"
                ? "AND customer_code = ?"
                : ""
            }
            ${
              productModel && productModel !== "All"
                ? "AND product_model = ?"
                : ""
            }
        ), 0) as special_expense
      FROM outbound_records 
      WHERE ${salesSqlConditions.join(" AND ")}
    `;

    // Constructing Parameters for Special Expenditure Queries
    const specialExpenseParams: any[] = [startDate, endDate];
    if (customerCode && customerCode !== "All") {
      specialExpenseParams.push(customerCode);
    }
    if (productModel && productModel !== "All") {
      specialExpenseParams.push(productModel);
    }

    const finalSalesParams = [...salesParams, ...specialExpenseParams];

    try {
      const result = await prisma.$queryRawUnsafe<any[]>(salesSql, ...finalSalesParams);
      const salesRow = result[0];

      const normalSales = decimalCalc.fromSqlResult(salesRow?.normal_sales, 0, 2);
      const specialExpense = decimalCalc.fromSqlResult(
        salesRow?.special_expense,
        0,
        2
      );
      const salesAmount = decimalCalc.toDbNumber(
        decimalCalc.subtract(normalSales, specialExpense),
        2
      );

      callback(null, {
        normal_sales: normalSales,
        special_expense: specialExpense,
        sales_amount: salesAmount,
      });
    } catch (err) {
      console.error("Failed to calculate sales:", err);
      callback(err as Error);
    }
  })();
}
