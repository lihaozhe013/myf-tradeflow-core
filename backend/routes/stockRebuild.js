const express = require('express');
const router = express.Router();
const db = require('../db');

// 进度状态（全局，仅适用于单用户/单任务场景）
let progressState = {
  total: 0,
  current: 0,
  running: false,
};

// 重建库存表
function rebuildStockTable(callback) {
  db.serialize(() => {
    // 1. 清空库存表
    db.run('DELETE FROM stock', (err) => {
      if (err) return callback(err);
      // 2. 处理入库记录
      db.all('SELECT id, product_model, quantity, inbound_date FROM inbound_records ORDER BY inbound_date, id', [], (err, inboundRows) => {
        if (err) return callback(err);
        // 3. 处理出库记录
        db.all('SELECT id, product_model, quantity, outbound_date FROM outbound_records ORDER BY outbound_date, id', [], (err, outboundRows) => {
          if (err) return callback(err);
          // 4. 合并所有操作，按时间顺序排序
          const ops = [];
          inboundRows.forEach(row => {
            ops.push({
              record_id: row.id,
              product_model: row.product_model,
              quantity: row.quantity,
              time: row.inbound_date,
              type: 'inbound'
            });
          });
          outboundRows.forEach(row => {
            ops.push({
              record_id: row.id,
              product_model: row.product_model,
              quantity: -row.quantity,
              time: row.outbound_date,
              type: 'outbound'
            });
          });
          // 按时间排序
          ops.sort((a, b) => new Date(a.time) - new Date(b.time));
          // 5. 逐条插入库存表
          const stockMap = {};
          let i = 0;
          function next() {
            if (i >= ops.length) return callback(null, { count: ops.length });
            const op = ops[i++];
            const key = op.product_model;
            stockMap[key] = (stockMap[key] || 0) + op.quantity;
            db.run(
              'INSERT INTO stock (record_id, product_model, stock_quantity, update_time) VALUES (?, ?, ?, ?)',
              [op.record_id, op.product_model, stockMap[key], op.time],
              (err) => {
                if (err) return callback(err);
                next();
              }
            );
          }
          next();
        });
      });
    });
  });
}

function rebuildStockTableWithProgress(callback) {
  db.serialize(() => {
    db.run('DELETE FROM stock', (err) => {
      if (err) return callback(err);
      db.all('SELECT id, product_model, quantity, inbound_date FROM inbound_records ORDER BY inbound_date, id', [], (err, inboundRows) => {
        if (err) return callback(err);
        db.all('SELECT id, product_model, quantity, outbound_date FROM outbound_records ORDER BY outbound_date, id', [], (err, outboundRows) => {
          if (err) return callback(err);
          const ops = [];
          inboundRows.forEach(row => {
            ops.push({
              record_id: row.id,
              product_model: row.product_model,
              quantity: row.quantity,
              time: row.inbound_date,
              type: 'inbound'
            });
          });
          outboundRows.forEach(row => {
            ops.push({
              record_id: row.id,
              product_model: row.product_model,
              quantity: -row.quantity,
              time: row.outbound_date,
              type: 'outbound'
            });
          });
          ops.sort((a, b) => new Date(a.time) - new Date(b.time));
          progressState.total = ops.length;
          progressState.current = 0;
          progressState.running = true;
          const stockMap = {};
          let i = 0;
          function next() {
            if (i >= ops.length) {
              progressState.current = progressState.total;
              progressState.running = false;
              return callback(null, { count: ops.length });
            }
            const op = ops[i++];
            const key = op.product_model;
            stockMap[key] = (stockMap[key] || 0) + op.quantity;
            db.run(
              'INSERT INTO stock (record_id, product_model, stock_quantity, update_time) VALUES (?, ?, ?, ?)',
              [op.record_id, op.product_model, stockMap[key], op.time],
              (err) => {
                if (err) {
                  progressState.running = false;
                  return callback(err);
                }
                progressState.current = i;
                next();
              }
            );
          }
          next();
        });
      });
    });
  });
}

router.post('/rebuild', (req, res) => {
  rebuildStockTableWithProgress((err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true, ...result });
    }
  });
});

// 新增进度查询接口
router.get('/progress', (req, res) => {
  res.json(progressState);
});

module.exports = router;
