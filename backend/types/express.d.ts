/**
 * 扩展 Express Request 类型以包含 user 属性
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
        role: string;
        name: string;
        pwd_ver: string;
      };
    }
  }
}

/**
 * 用户信息接口
 */
export interface User {
  username: string;
  role: string;
  name: string;
  pwd_ver: string;
}

/**
 * 自定义错误接口
 */
export interface CustomError extends Error {
  stack?: string;
}

// 必须导出至少一个内容以使其成为模块
export {};
