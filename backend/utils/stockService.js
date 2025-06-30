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

// 获取库存明细
function getStockSummary(productModel, callback) {
  let sql = `
    SELECT 
      product_model,
      SUM(CASE WHEN record_id IN (SELECT id FROM inbound_records) THEN stock_quantity ELSE 0 END) as total_inbound,
      SUM(CASE WHEN record_id IN (SELECT id FROM outbound_records) THEN ABS(stock_quantity) ELSE 0 END) as total_outbound,
      SUM(stock_quantity) as current_stock,
      MAX(update_time) as last_update
    FROM stock 
    WHERE 1=1
  `;
  
  let params = [];
  
  if (productModel) {
    sql += ' AND product_model LIKE ?';
    params.push(`%${productModel}%`);
  }
  
  sql += ' GROUP BY product_model ORDER BY product_model';
  
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