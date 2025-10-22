import db from '@/db';
import type { FilterOptions } from '@/routes/analysis/utils/types';

/**
 * 获取筛选选项（客户和产品列表）
 */
export function getFilterOptions(
  callback: (err: Error | null, options?: FilterOptions) => void
): void {
  // 查询所有客户
  const customerSql = `
    SELECT code, short_name, full_name 
    FROM partners 
    WHERE type = 1 
    ORDER BY short_name
  `;

  // 查询所有产品
  const productSql = `
    SELECT code, product_model 
    FROM products 
    ORDER BY product_model
  `;

  db.all(customerSql, [], (err1: Error | null, customers: any[]) => {
    if (err1) {
      console.error('查询客户列表失败:', err1);
      callback(err1);
      return;
    }

    db.all(productSql, [], (err2: Error | null, products: any[]) => {
      if (err2) {
        console.error('查询产品列表失败:', err2);
        callback(err2);
        return;
      }

      const customerOptions: FilterOptions['customers'] = [
        { code: 'All', name: 'All' },
        ...customers.map((c: any) => ({
          code: c.code,
          name: `${c.short_name} (${c.full_name})`
        }))
      ];

      const productOptions: FilterOptions['products'] = [
        { model: 'All', name: 'All' },
        ...products.map((p: any) => ({
          model: p.product_model,
          name: p.product_model
        }))
      ];

      callback(null, {
        customers: customerOptions,
        products: productOptions
      });
    });
  });
}
