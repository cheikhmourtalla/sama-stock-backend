import { logger, ServiceLogger } from "../config/logger-config";
import os from "os";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  SystemInfo,
  PerformanceMetrics,
  ErrorLog,
  AuditLog,
  MetricLog,
  LogMetadata,
  IServiceLogger,
} from "../interfaces/logger.js";

const filename = __filename;
const __dirname = path.dirname(filename);

class LoggerService {
  private loggers: Map<string, IServiceLogger>;
  private requestIdCounter: number;
  private startTime: number;

  constructor() {
    this.loggers = new Map();
    this.requestIdCounter = 0;
    this.startTime = Date.now();
  }

  getLogger(serviceName: string): IServiceLogger {
    if (!this.loggers.has(serviceName)) {
      this.loggers.set(serviceName, new ServiceLogger(serviceName));
    }
    return this.loggers.get(serviceName)!;
  }

  generateRequestId(): string {
    return `${Date.now()}-${++this.requestIdCounter}-${Math.random().toString(36).substring(2, 11)}`;
  }

  logSystemInfo(): SystemInfo {
    const systemInfo: SystemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      uptime: `${(os.uptime() / 60 / 60).toFixed(2)} hours`,
      nodeVersion: process.version,
      env: process.env.NODE_ENV || "development",
      pid: process.pid,
    };

    logger.info("System Information", systemInfo);
    return systemInfo;
  }

  async logPerformanceMetrics(): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      uptime: `${(process.uptime() / 60).toFixed(2)} minutes`,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      activeHandles: (process as any)._getActiveHandles().length,
      activeRequests: (process as any)._getActiveRequests().length,
    };

    logger.info("Performance Metrics", metrics as unknown as LogMetadata);
    return metrics;
  }

  logError(error: Error, context: LogMetadata = {}): void {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: (error as any).code,
      context,
      timestamp: new Date().toISOString(),
    };

    logger.error("Error occurred", errorLog as unknown as LogMetadata);

    if (process.env.NODE_ENV === "production") {
      this.sendToExternalService(errorLog);
    }
  }

  private async sendToExternalService(errorLog: ErrorLog): Promise<void> {
    try {
      // Exemple d'envoi vers un service externe
      // await fetch(process.env.EXTERNAL_LOG_URL!, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorLog)
      // });
    } catch (err) {
      console.error("Failed to send log to external service:", err);
    }
  }

  async cleanupOldLogs(daysToKeep: number = 30): Promise<void> {
    const logsDir = path.join(__dirname, "../../logs");
    try {
      const files = await fs.readdir(logsDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(logsDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          logger.info(`Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      const err = error as Error;
      logger.error("Error cleaning up old logs", { error: err.message });
    }
  }

  logAudit(
    action: string,
    user: { id: string; role: string; ip: string },
    details: LogMetadata = {},
  ): void {
    const auditLog: AuditLog = {
      timestamp: new Date().toISOString(),
      action,
      user: user.id,
      userRole: user.role,
      ip: user.ip,
      details,
      severity: "AUDIT",
    };

    logger.info("Audit Log", auditLog as unknown as LogMetadata);
  }

  logMetric(name: string, value: number, tags: LogMetadata = {}): void {
    const metricLog: MetricLog = {
      timestamp: new Date().toISOString(),
      metric: name,
      value,
      tags,
      type: "METRIC",
    };

    logger.debug("Metric", metricLog as unknown as LogMetadata);
  }
}

export default new LoggerService();
