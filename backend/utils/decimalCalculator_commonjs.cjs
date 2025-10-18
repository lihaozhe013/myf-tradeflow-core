const Decimal = require('decimal.js');

/**
 * 精确计算工具类
 * 基于 decimal.js 实现高精度浮点数运算
 */
class DecimalCalculator {
  constructor() {
    // 配置 Decimal.js
    Decimal.config({
      precision: 20,        // 精度设置为 20 位有效数字
      rounding: Decimal.ROUND_HALF_UP, // 四舍五入
      toExpNeg: -9,         // 负指数阈值
      toExpPos: 21,         // 正指数阈值
      modulo: Decimal.ROUND_DOWN,
      crypto: false
    });
  }

  /**
   * 创建 Decimal 实例
   * @param {number|string|Decimal} value 
   * @returns {Decimal}
   */
  decimal(value) {
    if (value === null || value === undefined) return new Decimal(0);
    return new Decimal(value);
  }

  /**
   * 加法运算
   * @param {number|string|Decimal} a 
   * @param {number|string|Decimal} b 
   * @returns {Decimal}
   */
  add(a, b) {
    return this.decimal(a).add(this.decimal(b));
  }

  /**
   * 减法运算
   * @param {number|string|Decimal} a 
   * @param {number|string|Decimal} b 
   * @returns {Decimal}
   */
  subtract(a, b) {
    return this.decimal(a).sub(this.decimal(b));
  }

  /**
   * 乘法运算
   * @param {number|string|Decimal} a 
   * @param {number|string|Decimal} b 
   * @returns {Decimal}
   */
  multiply(a, b) {
    return this.decimal(a).mul(this.decimal(b));
  }

  /**
   * 除法运算
   * @param {number|string|Decimal} a 
   * @param {number|string|Decimal} b 
   * @returns {Decimal}
   */
  divide(a, b) {
    const divisor = this.decimal(b);
    if (divisor.isZero()) {
      throw new Error('Division by zero');
    }
    return this.decimal(a).div(divisor);
  }

  /**
   * 计算总价（数量 × 单价）
   * @param {number|string} quantity 数量
   * @param {number|string} unitPrice 单价  
   * @returns {number} 保留5位小数的总价
   */
  calculateTotalPrice(quantity, unitPrice) {
    const q = this.decimal(quantity);
    const p = this.decimal(unitPrice);
    const result = q.mul(p);
    return this.toNumber(result, 5);
  }

  /**
   * 计算余额（总额 - 已付金额）
   * @param {number|string} totalAmount 总金额
   * @param {number|string} paidAmount 已付金额
   * @returns {number} 保留5位小数的余额
   */
  calculateBalance(totalAmount, paidAmount) {
    const total = this.decimal(totalAmount);
    const paid = this.decimal(paidAmount);
    const result = total.sub(paid);
    return this.toNumber(result, 5);
  }

  /**
   * 计算利润（销售额 - 成本）
   * @param {number|string} sales 销售额
   * @param {number|string} cost 成本
   * @returns {number} 保留5位小数的利润
   */
  calculateProfit(sales, cost) {
    const s = this.decimal(sales);
    const c = this.decimal(cost);
    const result = s.sub(c);
    return this.toNumber(result, 5);
  }

  /**
   * 计算利润率 (利润 / 成本 × 100%)
   * @param {number|string|Decimal} profit 利润
   * @param {number|string|Decimal} cost 成本
   * @returns {number} 保留1位小数的百分比
   */
  calculateProfitMargin(profit, cost) {
    const costDecimal = this.decimal(cost);
    if (costDecimal.isZero()) return 0;
    
    const result = this.multiply(this.divide(profit, cost), 100);
    return this.toNumber(result, 1);
  }

  /**
   * 计算加权平均价格
   * @param {Array} items 包含 {quantity, price} 的数组
   * @returns {number} 保留5位小数的平均价格
   */
  calculateWeightedAverage(items) {
    let totalQuantity = this.decimal(0);
    let totalValue = this.decimal(0);

    items.forEach(item => {
      const quantity = this.decimal(item.quantity);
      const price = this.decimal(item.price);
      const value = quantity.mul(price);
      
      totalQuantity = totalQuantity.add(quantity);
      totalValue = totalValue.add(value);
    });

    if (totalQuantity.isZero()) return 0;
    
    const result = totalValue.div(totalQuantity);
    return this.toNumber(result, 5);
  }

  /**
   * 求和运算
   * @param {Array<number|string|Decimal>} values 
   * @returns {number} 保留5位小数的数字
   */
  sum(values) {
    const result = values.reduce((acc, value) => {
      return acc.add(this.decimal(value));
    }, this.decimal(0));
    
    return this.toNumber(result, 5);
  }

  /**
   * 取绝对值
   * @param {number|string|Decimal} value 
   * @returns {Decimal}
   */
  abs(value) {
    return this.decimal(value).abs();
  }

  /**
   * 比较大小
   * @param {number|string|Decimal} a 
   * @param {number|string|Decimal} b 
   * @returns {number} -1(a<b), 0(a=b), 1(a>b)
   */
  compare(a, b) {
    return this.decimal(a).cmp(this.decimal(b));
  }

  /**
   * 判断是否为零
   * @param {number|string|Decimal} value 
   * @returns {boolean}
   */
  isZero(value) {
    return this.decimal(value).isZero();
  }

  /**
   * 判断是否为正数
   * @param {number|string|Decimal} value 
   * @returns {boolean}
   */
  isPositive(value) {
    return this.decimal(value).gt(0);
  }

  /**
   * 判断是否为负数
   * @param {number|string|Decimal} value 
   * @returns {boolean}
   */
  isNegative(value) {
    return this.decimal(value).lt(0);
  }

  /**
   * 转换为指定精度的数字
   * @param {Decimal} decimal 
   * @param {number} decimalPlaces 小数位数，默认5位（支持0.00001精度）
   * @returns {number}
   */
  toNumber(decimal, decimalPlaces = 5) {
    return parseFloat(decimal.toFixed(decimalPlaces));
  }

  /**
   * 转换为指定精度的字符串
   * @param {Decimal} decimal 
   * @param {number} decimalPlaces 小数位数，默认5位（支持0.00001精度）
   * @returns {string}
   */
  toString(decimal, decimalPlaces = 5) {
    return decimal.toFixed(decimalPlaces);
  }

  /**
   * 数据库数值安全处理 - 确保存储前转换为数字
   * @param {number|string|Decimal} value 
   * @param {number} decimalPlaces 小数位数，默认5位（支持0.00001精度）
   * @returns {number} 适合数据库存储的数字
   */
  toDbNumber(value, decimalPlaces = 5) {
    const decimal = this.decimal(value);
    return this.toNumber(decimal, decimalPlaces);
  }

  /**
   * 批量计算总价 - 用于处理记录数组
   * @param {Array} records 包含 quantity 和 unit_price 字段的记录数组
   * @returns {Array} 添加了 total_price 字段的记录数组
   */
  batchCalculateTotalPrice(records) {
    return records.map(record => ({
      ...record,
      total_price: this.calculateTotalPrice(record.quantity, record.unit_price)
    }));
  }

  /**
   * 计算SQL聚合结果 - 安全处理可能为null的聚合结果
   * @param {number|null|undefined} sqlResult SQL聚合函数结果
   * @param {number} defaultValue 默认值
   * @param {number} decimalPlaces 小数位数，默认5位（支持0.00001精度）
   * @returns {number}
   */
  fromSqlResult(sqlResult, defaultValue = 0, decimalPlaces = 5) {
    if (sqlResult === null || sqlResult === undefined) {
      return defaultValue;
    }
    const decimal = this.decimal(sqlResult);
    return this.toNumber(decimal, decimalPlaces);
  }
}

// 创建单例实例
const decimalCalc = new DecimalCalculator();

module.exports = decimalCalc;
