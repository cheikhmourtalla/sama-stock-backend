import { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import { logger } from "../config/logger-config";
import loggerService from "../services/logger.service.js";
import { RequestLog, ResponseLog, LogMetadata } from "../interfaces/logger.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

// Format Morgan personnalisé
export const morganFormat = morgan((tokens, req, res) => {
  const logData: LogMetadata = {
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: parseInt(tokens.status(req, res) || "0", 10),
    contentLength: tokens.res(req, res, "content-length"),
    responseTime: `${tokens["response-time"](req, res)}ms`,
    userAgent: tokens["user-agent"](req, res),
    remoteAddress: tokens["remote-addr"](req, res),
    remoteUser: tokens["remote-user"](req, res),
    referrer: tokens.referrer(req, res),
    httpVersion: tokens["http-version"](req, res),
  };

  const statusCode = parseInt(tokens.status(req, res) || "0", 10);

  if (statusCode >= 500) {
    logger.error("HTTP Error", logData);
  } else if (statusCode >= 400) {
    logger.warn("HTTP Warning", logData);
  } else {
    logger.http("HTTP Request", logData);
  }

  return JSON.stringify(logData);
});

// Middleware pour logger les requêtes
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const requestId = loggerService.generateRequestId();
  req.requestId = requestId;
  req.startTime = Date.now();

  const requestLog: RequestLog = {
    requestId,
    method: req.method,
    url: req.url,
    query: req.query,
    params: req.params,
    headers: {
      "user-agent": req.get("user-agent"),
      "content-type": req.get("content-type"),
      referer: req.get("referer"),
      "x-forwarded-for": req.get("x-forwarded-for"),
    },
    ip: req.ip,
    body:
      req.method === "POST" || req.method === "PUT"
        ? { ...req.body }
        : undefined,
  };

  // Masquer les données sensibles
  if (requestLog.body) {
    if (requestLog.body.password) requestLog.body.password = "***REDACTED***";
    if (requestLog.body.token) requestLog.body.token = "***REDACTED***";
    if (requestLog.body.refreshToken)
      requestLog.body.refreshToken = "***REDACTED***";
  }

  logger.debug(
    `Incoming Request: ${req.method} ${req.url}`,
    requestLog as unknown as LogMetadata,
  );

  // Capturer la réponse
  const originalSend = res.send;
  let responseData: any;

  res.send = function (data: any): Response {
    responseData = data;
    return originalSend.call(this, data);
  };

  res.on("finish", () => {
    const duration = Date.now() - req.startTime;
    const responseLog: ResponseLog = {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("content-length"),
      responseTime: duration,
    };

    if (res.statusCode >= 400) {
      logger.warn(
        `Response: ${req.method} ${req.url} - ${res.statusCode}`,
        responseLog as unknown as LogMetadata,
      );
    } else {
      logger.info(
        `Response: ${req.method} ${req.url} - ${res.statusCode}`,
        responseLog as unknown as LogMetadata,
      );
    }
  });

  next();
};

// Middleware pour logger les erreurs
export const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errorLog: LogMetadata = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: (err as any).code,
    },
    user: (req as any).user?.id || "anonymous",
    timestamp: new Date().toISOString(),
  };

  logger.error(`Error in ${req.method} ${req.url}`, errorLog);
  loggerService.logError(err, { requestId: req.requestId, url: req.url });

  next(err);
};

// Middleware pour logger les performances
export const performanceLogger = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime();

    res.on("finish", () => {
      const diff = process.hrtime(start);
      const duration = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2);

      if (parseFloat(duration) > threshold) {
        logger.warn("Slow request detected", {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          requestId: req.requestId,
        });
      }
    });

    next();
  };
};

// Middleware pour limiter le taux de logs
export const rateLimitedLogger = (maxLogsPerMinute: number = 100) => {
  const logCounts = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip as string;
    const now = Date.now();
    const minuteAgo = now - 60000;

    if (!logCounts.has(ip)) {
      logCounts.set(ip, []);
    }

    const timestamps = logCounts.get(ip)!;
    const recentLogs = timestamps.filter((t) => t > minuteAgo);

    if (recentLogs.length >= maxLogsPerMinute) {
      logger.warn("Rate limit exceeded for logging", {
        ip,
        requestId: req.requestId,
      });
      next();
      return;
    }

    recentLogs.push(now);
    logCounts.set(ip, recentLogs);
    next();
  };
};
