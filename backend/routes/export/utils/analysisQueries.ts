// 分析数据查询模块（TS + ESM）
import db from '@/db';

type Row = Record<string, any>;

export default class AnalysisQueries {
  async getCustomerAnalysisData(startDate: string, endDate: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const customerSalesSql = `
        SELECT 
          p.code as customer_code,
          p.full_name as customer_name,
          o.product_model,
          SUM(o.quantity) as total_quantity,
          SUM(o.total_price) as sales_amount
        FROM outbound_records o
        LEFT JOIN partners p ON (o.customer_code = p.code OR o.customer_short_name = p.short_name)
        WHERE o.outbound_date >= ? AND o.outbound_date <= ?
        AND p.code IS NOT NULL
        AND o.unit_price >= 0
        GROUP BY p.code, p.full_name, o.product_model
        ORDER BY p.full_name, o.product_model
      `;

      db.all(customerSalesSql, [startDate, endDate], (err: any, salesData: Row[]) => {
        if (err) return reject(err);
        if (!salesData || salesData.length === 0) return resolve([]);

        const avgCostSql = `
          SELECT 
            product_model,
            SUM(quantity * unit_price) / SUM(quantity) as avg_cost_price
          FROM inbound_records 
          WHERE unit_price >= 0
          GROUP BY product_model
        `;

        db.all(avgCostSql, [], (costErr: any, costData: Row[]) => {
          if (costErr) return reject(costErr);
          const costMap: Record<string, number> = {};
          (costData || []).forEach(item => { costMap[item['product_model']] = item['avg_cost_price'] || 0; });

          const customerMap: Record<string, any> = {};
          (salesData || []).forEach(row => {
            const customerCode = row['customer_code'];
            const customerName = row['customer_name'];
            const productModel = row['product_model'];
            const salesAmount = row['sales_amount'] || 0;
            const quantity = row['total_quantity'] || 0;
            const avgCostPrice = costMap[productModel] || 0;
            const costAmount = avgCostPrice * quantity;
            const profitAmount = salesAmount - costAmount;
            const profitRate = salesAmount > 0 ? (profitAmount / salesAmount) * 100 : 0;

            if (!customerMap[customerCode]) {
              customerMap[customerCode] = {
                customer_code: customerCode,
                customer_name: customerName,
                sales_amount: 0,
                cost_amount: 0,
                profit_amount: 0,
                profit_rate: 0,
                product_details: [] as any[]
              };
            }

            customerMap[customerCode].sales_amount += salesAmount;
            customerMap[customerCode].cost_amount += costAmount;
            customerMap[customerCode].profit_amount += profitAmount;
            customerMap[customerCode].product_details.push({
              product_model: productModel,
              sales_amount: salesAmount,
              cost_amount: costAmount,
              profit_amount: profitAmount,
              profit_rate: profitRate
            });
          });

          Object.values(customerMap).forEach((customer: any) => {
            customer.profit_rate = customer.sales_amount > 0
              ? (customer.profit_amount / customer.sales_amount) * 100
              : 0;
          });

          const result = Object.values(customerMap)
            .sort((a: any, b: any) => b.sales_amount - a.sales_amount);
          resolve(result);
        });
      });
    });
  }

  async getProductAnalysisData(startDate: string, endDate: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const productSalesSql = `
        SELECT 
          o.product_model,
          p.code as customer_code,
          p.full_name as customer_name,
          SUM(o.quantity) as total_quantity,
          SUM(o.total_price) as sales_amount
        FROM outbound_records o
        LEFT JOIN partners p ON (o.customer_code = p.code OR o.customer_short_name = p.short_name)
        WHERE o.outbound_date >= ? AND o.outbound_date <= ?
        AND p.code IS NOT NULL
        AND o.unit_price >= 0
        GROUP BY o.product_model, p.code, p.full_name
        ORDER BY o.product_model, p.full_name
      `;

      db.all(productSalesSql, [startDate, endDate], (err: any, salesData: Row[]) => {
        if (err) return reject(err);
        if (!salesData || salesData.length === 0) return resolve([]);

        const avgCostSql = `
          SELECT 
            product_model,
            SUM(quantity * unit_price) / SUM(quantity) as avg_cost_price
          FROM inbound_records 
          WHERE unit_price >= 0
          GROUP BY product_model
        `;

        db.all(avgCostSql, [], (costErr: any, costData: Row[]) => {
          if (costErr) return reject(costErr);
          const costMap: Record<string, number> = {};
          (costData || []).forEach(item => { costMap[item['product_model']] = item['avg_cost_price'] || 0; });

          const productMap: Record<string, any> = {};
          (salesData || []).forEach(row => {
            const productModel = row['product_model'];
            const customerCode = row['customer_code'];
            const customerName = row['customer_name'];
            const salesAmount = row['sales_amount'] || 0;
            const quantity = row['total_quantity'] || 0;
            const avgCostPrice = costMap[productModel] || 0;
            const costAmount = avgCostPrice * quantity;
            const profitAmount = salesAmount - costAmount;
            const profitRate = salesAmount > 0 ? (profitAmount / salesAmount) * 100 : 0;

            if (!productMap[productModel]) {
              productMap[productModel] = {
                product_model: productModel,
                sales_amount: 0,
                cost_amount: 0,
                profit_amount: 0,
                profit_rate: 0,
                customer_details: [] as any[]
              };
            }

            productMap[productModel].sales_amount += salesAmount;
            productMap[productModel].cost_amount += costAmount;
            productMap[productModel].profit_amount += profitAmount;
            productMap[productModel].customer_details.push({
              customer_code: customerCode,
              customer_name: customerName,
              sales_amount: salesAmount,
              cost_amount: costAmount,
              profit_amount: profitAmount,
              profit_rate: profitRate
            });
          });

          Object.values(productMap).forEach((product: any) => {
            product.profit_rate = product.sales_amount > 0
              ? (product.profit_amount / product.sales_amount) * 100
              : 0;
          });

          const result = Object.values(productMap)
            .filter((product: any) => product.product_model && product.product_model.trim() !== '')
            .sort((a: any, b: any) => b.sales_amount - a.sales_amount);
          resolve(result);
        });
      });
    });
  }
}
