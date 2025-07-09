/**
 * 应用配置统一导出模块
 * 从 appConfig.json 导入所有配置项
 */

import configData from './appConfig.json' with { type: 'json' };

// 付款方式相关配置
export const PAYMENT_METHODS = configData.paymentMethods.list;
export const DEFAULT_PAYMENT_METHOD = configData.paymentMethods.default;
export const PAYMENT_METHOD_CONFIG = configData.paymentMethods.config;

// 产品类别相关配置
export const PRODUCT_CATEGORIES = configData.productCategories.list;
export const DEFAULT_PRODUCT_CATEGORY = configData.productCategories.default;

// 获取付款方式选项（用于下拉框）
export const getPaymentMethodOptions = () => {
  return PAYMENT_METHODS.map(method => ({
    value: method,
    label: method
  }));
};

// 获取付款方式标签
export const getPaymentMethodLabel = (value) => {
  return value || '';
};

// 获取产品类别选项（用于下拉框）
export const getProductCategoryOptions = () => {
  return PRODUCT_CATEGORIES.map(category => ({
    value: category,
    label: category
  }));
};

// 检查是否为有效的付款方式
export const isValidPaymentMethod = (method) => {
  return PAYMENT_METHODS.includes(method);
};

// 检查是否为有效的产品类别
export const isValidProductCategory = (category) => {
  return PRODUCT_CATEGORIES.includes(category);
};

// 导出原始配置数据（如需要）
export const CONFIG_DATA = configData;
