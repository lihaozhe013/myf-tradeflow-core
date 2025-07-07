const db = require('../db');

// 更新库存函数
function updateStock(recordId, productModel, quantity, type) {
  const now = new Date().toISOString().replace('T', ' ').substr(0, 19);
  
  // 获取当前库存
  db.get(
    'SELECT SUM(stock_quantity) as current_stock FROM stock WHERE product_model = ?',
    [productModel],
    (err, row) => {
      if (err) {
        console.error('获取当前库存失败:', err);
        return;
      }
      
      const currentStock = row.current_stock || 0;
      const newStock = currentStock + quantity;
      
      // 插入库存记录
      db.run(
        'INSERT INTO stock (record_id, product_model, stock_quantity, update_time) VALUES (?, ?, ?, ?)',
        [recordId, productModel, newStock, now],
        (err) => {
          if (err) {
            console.error('更新库存失败:', err);
          } else {
            console.log(`库存更新成功: ${productModel} ${type} ${quantity}, 当前库存: ${newStock}`);
          }
        }
      );
    }
  );
}

// 获取库存明细（只取每种商品最新一条记录）
function getStockSummary(productModel, callback) {
  let sql = `
    SELECT s.product_model, s.stock_quantity as current_stock, s.update_time as last_update
    FROM stock s
    INNER JOIN (
      SELECT product_model, MAX(update_time) as max_update
      FROM stock
      WHERE 1=1
      ${productModel ? 'AND product_model LIKE ?' : ''}
      GROUP BY product_model
    ) latest
    ON s.product_model = latest.product_model AND s.update_time = latest.max_update
    ${productModel ? 'WHERE s.product_model LIKE ?' : ''}
    ORDER BY s.product_model
  `;
  let params = [];
  if (productModel) {
    params.push(`%${productModel}%`);
    params.push(`%${productModel}%`);
  }
  db.all(sql, params, callback);
}

// 获取库存历史记录
function getStockHistory(productModel, page = 1, limit = 20, callback) {
  let sql = 'SELECT * FROM stock WHERE 1=1';
  let params = [];
  
  if (productModel) {
    sql += ' AND product_model LIKE ?';
    params.push(`%${productModel}%`);
  }
  
  sql += ' ORDER BY update_time DESC';
  
  const offset = (page - 1) * limit;
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(sql, params, callback);
}

module.exports = {
  updateStock,
  getStockSummary,
  getStockHistory
};