import winston from "winston";
import path from "path";
import fs from "fs";
import { resolveFilesInDataPath } from "@/utils/paths";

const logDir: string = resolveFilesInDataPath("log");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "myf-db-system" },
  transports: [],
});

if (process.env["NODE_ENV"] === "production") {
  // App Log - Records only warnings and higher levels
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "app.log"),
      level: "warn",
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      tailable: true,
    })
  );

  // Error Log
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      tailable: true,
    })
  );

  console.log(`Prod Env logs have been configured - Log directory: ${logDir}`);
} else {
  // The dev env only outputs to the console.
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${
            timestamp || new Date().toISOString()
          } [${level}] ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ""
          }`;
        })
      ),
    })
  );
}

// Create an Access Logger - Log API requests only
export const accessLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(({ timestamp, message }) => {
      return `${timestamp} ${message}`;
    })
  ),
  transports: [],
});

if (process.env["NODE_ENV"] === "production") {
  accessLogger.add(
    new winston.transports.File({
      filename: path.join(logDir, "access.log"),
      maxsize: 3 * 1024 * 1024, // 3MB
      maxFiles: 3,
      tailable: true,
    })
  );
} else {
  // Dev Env outputs access logs to the console.
  accessLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}
