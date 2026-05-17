import loggerService from "../services/logger.service";

async function cleanLogs() {
  console.log("Starting log cleanup...");
  await loggerService.cleanupOldLogs(30);
  console.log("Log cleanup completed");
}

cleanLogs().catch(console.error);
