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
export interface User {
  username: string;
  role: string;
  name: string;
  pwd_ver: string;
}

export interface CustomError extends Error {
  stack?: string;
}

export {};
