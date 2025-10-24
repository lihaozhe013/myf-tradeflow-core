import db from "@/db";

export default class BasicDataQueries {
  async getBaseInfoData(tables: string = "123"): Promise<any> {
    const result: any = {};
    if (tables.includes("1")) result.partners = await this.getPartnersData();
    if (tables.includes("2")) result.products = await this.getProductsData();
    if (tables.includes("3")) result.prices = await this.getPricesData();
    return result;
  }

  getPartnersData(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT code, short_name, full_name, 
               CASE WHEN type = 0 THEN '供应商' ELSE '客户' END as type_name,
               address, contact_person, contact_phone 
        FROM partners 
        ORDER BY short_name
      `;
      db.all(sql, [], (err: any, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  getProductsData(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT code, category, product_model, remark 
        FROM products 
        ORDER BY category, product_model
      `;
      db.all(sql, [], (err: any, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  getPricesData(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT partner_short_name, product_model, effective_date, unit_price 
        FROM product_prices 
        ORDER BY partner_short_name, product_model, effective_date DESC
      `;
      db.all(sql, [], (err: any, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}
