import db from "@/db";
import type { FilterOptions } from "@/routes/analysis/utils/types";

/**
 * Retrieve filter options (customer and product lists)
 */
export function getFilterOptions(
  callback: (err: Error | null, options?: FilterOptions) => void
): void {
  const customerSql = `
    SELECT code, short_name, full_name 
    FROM partners 
    WHERE type = 1 
    ORDER BY short_name
  `;

  const productSql = `
    SELECT code, product_model 
    FROM products 
    ORDER BY product_model
  `;

  db.all(customerSql, [], (err1: Error | null, customers: any[]) => {
    if (err1) {
      console.error("Failed to retrieve customer list:", err1);
      callback(err1);
      return;
    }

    db.all(productSql, [], (err2: Error | null, products: any[]) => {
      if (err2) {
        console.error("Failed to retrieve customer list:", err2);
        callback(err2);
        return;
      }

      const customerOptions: FilterOptions["customers"] = [
        { code: "All", name: "All" },
        ...customers.map((c: any) => ({
          code: c.code,
          name: `${c.short_name} (${c.full_name})`,
        })),
      ];

      const productOptions: FilterOptions["products"] = [
        { model: "All", name: "All" },
        ...products.map((p: any) => ({
          model: p.product_model,
          name: p.product_model,
        })),
      ];

      callback(null, {
        customers: customerOptions,
        products: productOptions,
      });
    });
  });
}
