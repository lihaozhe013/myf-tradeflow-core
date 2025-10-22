import type { ValidationResult } from '@/routes/analysis/utils/types';

/**
 * 验证分析参数
 */
export function validateAnalysisParams(params: {
  start_date?: string;
  end_date?: string;
  customer_code?: string;
  product_model?: string;
}): ValidationResult {
  const { start_date, end_date } = params;

  // 检查必填参数
  if (!start_date || !end_date) {
    return { isValid: false, error: '开始日期和结束日期不能为空' };
  }

  // 日期格式校验
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
    return { isValid: false, error: '日期格式错误，请使用 YYYY-MM-DD 格式' };
  }

  // 检查日期区间合理性
  if (new Date(start_date) > new Date(end_date)) {
    return { isValid: false, error: '开始日期不能晚于结束日期' };
  }

  return { isValid: true };
}

/**
 * 验证基础分析参数（只需要时间区间）
 */
export function validateBasicParams(params: { start_date?: string; end_date?: string }): ValidationResult {
  const { start_date, end_date } = params;

  if (!start_date || !end_date) {
    return { isValid: false, error: '开始日期和结束日期不能为空' };
  }

  return { isValid: true };
}
