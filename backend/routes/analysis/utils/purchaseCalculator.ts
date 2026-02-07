import { prisma } from "@/prismaClient.js";
import decimalCalc from "@/utils/decimalCalculator.js";
import type { PurchaseData } from "@/routes/analysis/utils/types.js";

export function calculatePurchaseData(
  startDate: string,
  endDate: string,
  supplierCode: string | null | undefined,
  productModel: string | null | undefined,
  callback: (err: Error | null, purchaseData?: PurchaseData) => void
): void {
  (async () => {
    // Build Purchase Query Conditions
    const purchaseSqlConditions: string[] = [
      "date(inbound_date) BETWEEN ? AND ?",
    ];
    const purchaseParams: any[] = [startDate, endDate];

    if (supplierCode && supplierCode !== "All") {
      purchaseSqlConditions.push("supplier_code = ?");
      purchaseParams.push(supplierCode);
    }

    if (productModel && productModel !== "All") {
      purchaseSqlConditions.push("product_model = ?");
      purchaseParams.push(productModel);
    }

    const purchaseSql = `
      SELECT 
        COALESCE(SUM(quantity * unit_price), 0) as purchase_amount
      FROM inbound_records 
      WHERE ${purchaseSqlConditions.join(" AND ")}
    `;

    try {
      // Use queryRawUnsafe because of dynamic WHERE clause construction
      const result = await prisma.$queryRawUnsafe<any[]>(purchaseSql, ...purchaseParams);
      const purchaseRow = result[0];
      const purchaseAmount = decimalCalc.fromSqlResult(purchaseRow?.purchase_amount, 0, 2);

      callback(null, {
        purchase_amount: purchaseAmount,
      });
    } catch (err) {
      console.error("Failed to calculate purchase:", err);
      callback(err as Error);
    }
  })();
}
