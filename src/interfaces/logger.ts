import { LogEntry as WinstonLogEntry } from 'winston';

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug' | 'trace';

export interface LogMetadata {
  [key: string]: any;
  service?: string;
  requestId?: string;
  duration?: string;
  userId?: string;
  ip?: string;
}

export interface SystemInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: string;
  freeMemory: string;
  uptime: string;
  nodeVersion: string;
  env: string;
  pid: number;
}

export interface PerformanceMetrics {
  uptime: string;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  activeHandles: number;
  activeRequests: number;
}

export interface ErrorLog {
  message: string;
  stack?: string;
  name: string;
  code?: string;
  context: LogMetadata;
  timestamp: string;
}

export interface RequestLog {
  requestId: string;
  method: string;
  url: string;
  query?: any;
  params?: any;
  headers?: any;
  ip?: string;
  body?: any;
}

export interface ResponseLog {
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  duration: string;
  contentLength?: string;
  responseTime: number;
}

export interface AuditLog {
  timestamp: string;
  action: string;
  user: string;
  userRole: string;
  ip: string;
  details: LogMetadata;
  severity: 'AUDIT';
}

export interface MetricLog {
  timestamp: string;
  metric: string;
  value: number;
  tags: LogMetadata;
  type: 'METRIC';
}

export interface ILogger {
  error(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  info(message: string, meta?: LogMetadata): void;
  http(message: string, meta?: LogMetadata): void;
  debug(message: string, meta?: LogMetadata): void;
  trace(message: string, meta?: LogMetadata): void;
}

export interface IServiceLogger extends ILogger {
  measurePerformance<T>(operationName: string, fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T>;
}