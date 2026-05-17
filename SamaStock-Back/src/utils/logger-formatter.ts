import chalk from "chalk";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LogMetadata, AuditLog, MetricLog } from "../interfaces/logger";

export class LogFormatter {
  static formatConsole(
    level: string,
    message: string,
    meta: LogMetadata = {},
  ): string {
    const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss.SSS", {
      locale: fr,
    });
    const colors: Record<string, typeof chalk> = {
      error: chalk.red,
      warn: chalk.yellow,
      info: chalk.green,
      http: chalk.magenta,
      debug: chalk.blue,
      trace: chalk.gray,
    };

    const color = colors[level] || chalk.white;
    let formattedMessage = `${chalk.gray(timestamp)} ${color(`[${level.toUpperCase()}]`)} ${message}`;

    if (Object.keys(meta).length > 0) {
      formattedMessage += `\n${chalk.gray(JSON.stringify(meta, null, 2))}`;
    }

    return formattedMessage;
  }

  static formatJSON(
    level: string,
    message: string,
    meta: LogMetadata = {},
  ): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    });
  }

  static formatAudit(auditLog: AuditLog): string {
    return JSON.stringify(auditLog, null, 2);
  }

  static formatMetric(metricLog: MetricLog): string {
    return JSON.stringify(metricLog);
  }

  static formatErrorForConsole(error: Error, context?: LogMetadata): string {
    let output = chalk.red(`\n❌ Error: ${error.message}\n`);
    output += chalk.gray(`   Type: ${error.name}\n`);

    if (context && Object.keys(context).length > 0) {
      output += chalk.yellow(
        `   Context: ${JSON.stringify(context, null, 2)}\n`,
      );
    }

    if (error.stack) {
      output += chalk.gray(
        `   Stack: ${error.stack.split("\n").slice(1).join("\n          ")}\n`,
      );
    }

    return output;
  }

  static formatPerformanceMetric(
    operation: string,
    duration: number,
    metadata?: LogMetadata,
  ): string {
    const durationColor =
      duration > 1000 ? chalk.red : duration > 500 ? chalk.yellow : chalk.green;
    let output = chalk.cyan(`📊 Performance: ${operation}\n`);
    output += `   Duration: ${durationColor(`${duration.toFixed(2)}ms`)}\n`;

    if (metadata) {
      output += `   Metadata: ${chalk.gray(JSON.stringify(metadata))}\n`;
    }

    return output;
  }
}
