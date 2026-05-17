import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
// import { fileURLToPath } from "url";
import {
  LogLevel,
  LogMetadata,
  IServiceLogger,
} from "../interfaces/logger.js";


const filename = __filename; 
 const __dirname = path.dirname(filename);



// Niveaux de log personnalisés
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5,
};

// Couleurs pour chaque niveau
const logColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
  trace: "gray",
};

winston.addColors(logColors);

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
   
  winston.format.printf(
    ({ timestamp, level, message, service, stack, ...meta }) => {
      let log = `${timestamp} [${level.toUpperCase()}]`;

      if (service) log += ` [${service}]`;
      log += `: ${message}`;

      const metaObj = meta as LogMetadata;
      if (Object.keys(metaObj).length > 0 && metaObj.duration) {
        log += ` - ${JSON.stringify(metaObj)}`;
      } else if (Object.keys(metaObj).length > 0) {
        log += `\n${JSON.stringify(metaObj, null, 2)}`;
      }

      if (stack) {
        log += `\nStack Trace: ${stack}`;
      }

      return log;
    },
  ),
);

// Format JSON pour la production
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Transport pour fichiers avec rotation
const dailyRotateFileTransport = (
  level: LogLevel,
  filename: string,
): DailyRotateFile => {
  return new DailyRotateFile({
    filename: path.join("logs", `%DATE%`, filename),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
    level: level,
    format: jsonFormat,
  });
};

// Configuration des transports
const transports: winston.transport[] = [];

// Transport console
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      customFormat,
    ),
    level: process.env.LOG_LEVEL || "debug",
  }),
);

// Transports fichiers pour production
if (process.env.NODE_ENV === "production") {
  transports.push(dailyRotateFileTransport("error", "error.log"));
  transports.push(dailyRotateFileTransport("warn", "warn.log"));
  transports.push(dailyRotateFileTransport("info", "app.log"));
  transports.push(dailyRotateFileTransport("http", "http.log"));
  transports.push(dailyRotateFileTransport("debug", "debug.log"));

  transports.push(
    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
      maxsize: 5242880,
      maxFiles: 5,
      format: jsonFormat,
    }),
  );
}

// Logger principal
export const logger = winston.createLogger({
  levels: logLevels,
  format: customFormat,
  transports,
  exitOnError: false,
});

// Service Logger Class
export class ServiceLogger implements IServiceLogger {
  private serviceName: string;
  private logger: winston.Logger;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.logger = logger.child({ service: serviceName });
  }

  error(message: string, meta: LogMetadata = {}): void {
    this.logger.error(message, { ...meta, service: this.serviceName });
  }

  warn(message: string, meta: LogMetadata = {}): void {
    this.logger.warn(message, { ...meta, service: this.serviceName });
  }

  info(message: string, meta: LogMetadata = {}): void {
    this.logger.info(message, { ...meta, service: this.serviceName });
  }

  http(message: string, meta: LogMetadata = {}): void {
    this.logger.http(message, { ...meta, service: this.serviceName });
  }

  debug(message: string, meta: LogMetadata = {}): void {
    this.logger.debug(message, { ...meta, service: this.serviceName });
  }

  trace(message: string, meta: LogMetadata = {}): void {
    this.logger.log("trace", message, { ...meta, service: this.serviceName });
  }

  async measurePerformance<T>(
    operationName: string,
    fn: (...args: any[]) => Promise<T>,
    ...args: any[]
  ): Promise<T> {
    const start = process.hrtime();
    try {
      const result = await fn(...args);
      const diff = process.hrtime(start);
      const duration = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2);

      this.info(`${operationName} completed`, {
        duration: `${duration}ms`,
        status: "success",
      });

      return result;
    } catch (error) {
      const diff = process.hrtime(start);
      const duration = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2);
      const err = error as Error;

      this.error(`${operationName} failed`, {
        duration: `${duration}ms`,
        error: err.message,
        stack: err.stack,
      });

      throw error;
    }
  }
}


export const stream = {
  write: (message: string) => {
    const cleanMessage = message.trim();
    logger.http(cleanMessage);
  }
};