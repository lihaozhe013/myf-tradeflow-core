/**
 * 精确计算工具类
 * 基于 decimal.js 实现高精度浮点数运算
 */
import Decimal from 'decimal.js';

// 配置 Decimal.js
Decimal.config({
  precision: 20,        // 精度设置为 20 位有效数字
  rounding: Decimal.ROUND_HALF_UP, // 四舍五入
  toExpNeg: -9,         // 负指数阈值
  toExpPos: 21,         // 正指数阈值
  modulo: Decimal.ROUND_DOWN,
  crypto: false
});

/**
 * 产品记录接口 - 包含数量和单价
 */
interface ProductRecord {
  quantity: number | string;
  unit_price: number | string;
}

/**
 * 加权平均项接口
 */
interface WeightedAverageItem {
  quantity: number | string;
  price: number | string;
}

/**
 * 精确计算工具类
 */
class DecimalCalculator {
  /**
   * 创建 Decimal 实例
   */
  decimal(value: number | string | Decimal | null | undefined): Decimal {
    if (value === null || value === undefined) return new Decimal(0);
    return new Decimal(value);
  }

  /**
   * 加法运算
   */
  add(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return this.decimal(a).add(this.decimal(b));
  }

  /**
   * 减法运算
   */
  subtract(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return this.decimal(a).sub(this.decimal(b));
  }

  /**
   * 乘法运算
   */
  multiply(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return this.decimal(a).mul(this.decimal(b));
  }

  /**
   * 除法运算
   */
  divide(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    const divisor = this.decimal(b);
    if (divisor.isZero()) {
      throw new Error('Division by zero');
    }
    return this.decimal(a).div(divisor);
  }

  /**
   * 计算总价（数量 × 单价）
   * @param quantity 数量
   * @param unitPrice 单价  
   * @returns 保留5位小数的总价
   */
  calculateTotalPrice(quantity: number | string, unitPrice: number | string): number {
    const q = this.decimal(quantity);
    const p = this.decimal(unitPrice);
    const result = q.mul(p);
    return this.toNumber(result, 5);
  }

  /**
   * 计算余额（总额 - 已付金额）
   * @param totalAmount 总金额
   * @param paidAmount 已付金额
   * @returns 保留5位小数的余额
   */
  calculateBalance(totalAmount: number | string, paidAmount: number | string): number {
    const total = this.decimal(totalAmount);
    const paid = this.decimal(paidAmount);
    const result = total.sub(paid);
    return this.toNumber(result, 5);
  }

  /**
   * 计算利润（销售额 - 成本）
   * @param sales 销售额
   * @param cost 成本
   * @returns 保留5位小数的利润
   */
  calculateProfit(sales: number | string, cost: number | string): number {
    const s = this.decimal(sales);
    const c = this.decimal(cost);
    const result = s.sub(c);
    return this.toNumber(result, 5);
  }

  /**
   * 计算利润率 (利润 / 成本 × 100%)
   * @param profit 利润
   * @param cost 成本
   * @returns 保留1位小数的百分比
   */
  calculateProfitMargin(profit: number | string | Decimal, cost: number | string | Decimal): number {
    const costDecimal = this.decimal(cost);
    if (costDecimal.isZero()) return 0;
    
    const result = this.multiply(this.divide(profit, cost), 100);
    return this.toNumber(result, 1);
  }

  /**
   * 计算加权平均价格
   * @param items 包含 {quantity, price} 的数组
   * @returns 保留5位小数的平均价格
   */
  calculateWeightedAverage(items: WeightedAverageItem[]): number {
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
   * @returns 保留5位小数的数字
   */
  sum(values: (number | string | Decimal)[]): number {
    const result = values.reduce<Decimal>((acc, value) => {
      return acc.add(this.decimal(value));
    }, this.decimal(0));
    
    return this.toNumber(result, 5);
  }

  /**
   * 取绝对值
   */
  abs(value: number | string | Decimal): Decimal {
    return this.decimal(value).abs();
  }

  /**
   * 比较大小
   * @returns -1(a<b), 0(a=b), 1(a>b)
   */
  compare(a: number | string | Decimal, b: number | string | Decimal): number {
    return this.decimal(a).cmp(this.decimal(b));
  }

  /**
   * 判断是否为零
   */
  isZero(value: number | string | Decimal): boolean {
    return this.decimal(value).isZero();
  }

  /**
   * 判断是否为正数
   */
  isPositive(value: number | string | Decimal): boolean {
    return this.decimal(value).gt(0);
  }

  /**
   * 判断是否为负数
   */
  isNegative(value: number | string | Decimal): boolean {
    return this.decimal(value).lt(0);
  }

  /**
   * 转换为指定精度的数字
   * @param decimal 
   * @param decimalPlaces 小数位数，默认5位（支持0.00001精度）
   */
  toNumber(decimal: Decimal, decimalPlaces: number = 5): number {
    return parseFloat(decimal.toFixed(decimalPlaces));
  }

  /**
   * 转换为指定精度的字符串
   * @param decimal 
   * @param decimalPlaces 小数位数，默认5位（支持0.00001精度）
   */
  toString(decimal: Decimal, decimalPlaces: number = 5): string {
    return decimal.toFixed(decimalPlaces);
  }

  /**
   * 数据库数值安全处理 - 确保存储前转换为数字
   * @param value 
   * @param decimalPlaces 小数位数，默认5位（支持0.00001精度）
   * @returns 适合数据库存储的数字
   */
  toDbNumber(value: number | string | Decimal, decimalPlaces: number = 5): number {
    const decimal = this.decimal(value);
    return this.toNumber(decimal, decimalPlaces);
  }

  /**
   * 批量计算总价 - 用于处理记录数组
   * @param records 包含 quantity 和 unit_price 字段的记录数组
   * @returns 添加了 total_price 字段的记录数组
   */
  batchCalculateTotalPrice<T extends ProductRecord>(records: T[]): (T & { total_price: number })[] {
    return records.map(record => ({
      ...record,
      total_price: this.calculateTotalPrice(record.quantity, record.unit_price)
    }));
  }

  /**
   * 计算SQL聚合结果 - 安全处理可能为null的聚合结果
   * @param sqlResult SQL聚合函数结果
   * @param defaultValue 默认值
   * @param decimalPlaces 小数位数，默认5位（支持0.00001精度）
   */
  fromSqlResult(sqlResult: number | null | undefined, defaultValue: number = 0, decimalPlaces: number = 5): number {
    if (sqlResult === null || sqlResult === undefined) {
      return defaultValue;
    }
    const decimal = this.decimal(sqlResult);
    return this.toNumber(decimal, decimalPlaces);
  }
}

// 创建单例实例
const decimalCalc = new DecimalCalculator();

export default decimalCalc;
