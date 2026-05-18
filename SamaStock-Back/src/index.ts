// app.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

// Import des configurations
import swaggerSpec from "./swagger-config.js";
import { logger, stream } from "./config/logger-config.js";
import loggerService from "./services/logger.service.js";

// Import des middlewares
import {
  requestLogger,
  errorLogger,
  performanceLogger,
  rateLimitedLogger,
} from "./middlewares/logger.middleware.js";
import { globalErrorHandler, notFoundHandler } from "./middlewares/error.js";
import { ErrorService } from "./services/error.service.js";

// Import des routes
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import stockRoutes from "./routes/stock.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import clientRoutes from "./routes/client.routes.js";
import supplierRoute from "./routes/supplier.route.js";
import cashRoutes from "./routes/cash.routes.js";

// ==================== INITIALISATION ====================
const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(requestLogger);
app.use(performanceLogger(3000)); // Log les requêtes lentes (>3s)
app.use(rateLimitedLogger(200)); // Limite à 200 logs/min par IP

// 2. Middlewares standards
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      // "https://tonfrontend.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// 3. Morgan pour les logs HTTP (via Winston)
app.use(morgan("combined", { stream }));

// ==================== DOCUMENTATION SWAGGER ====================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== ROUTES PUBLIQUES ====================
app.get("/", (_req: Request, res: Response) => {
  const serviceLogger = loggerService.getLogger("MainRoute");
  serviceLogger.info("Accès à la route principale", {
    ip: _req.ip,
    userAgent: _req.get("user-agent"),
  });

  res.json({
    message: "Bienvenue sur le backend de SamaStock",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
  });
});

// ==================== ROUTES API ====================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/suppliers", supplierRoute);
app.use("/api/cash", cashRoutes);

// ==================== GESTION DES ERREURS ====================
// 404 handler - doit être après toutes les routes
app.use(notFoundHandler);

// Global error handler - doit être le dernier middleware
app.use(globalErrorHandler);

// ==================== DÉMARRAGE DU SERVEUR ====================
const server = app.listen(PORT, () => {
  logger.info(`SamaStock backend démarré avec succès`, {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    url: `http://localhost:${PORT}`,
    docs: `http://localhost:${PORT}/api-docs`,
    pid: process.pid,
    nodeVersion: process.version,
  });

  console.log(`\n🚀 SamaStock backend running on http://localhost:${PORT}`);
  console.log(
    `📚 Swagger API documentation: http://localhost:${PORT}/api-docs`,
  );
  console.log(`📝 Logs système disponibles dans /logs directory\n`);
});

// ==================== TÂCHES PLANIFIÉES ====================
// Nettoyage des logs toutes les 24h
setInterval(
  () => {
    loggerService.cleanupOldLogs(30);
  },
  24 * 60 * 60 * 1000,
);

// Métriques toutes les heures
setInterval(
  () => {
    loggerService.logPerformanceMetrics();
  },
  60 * 60 * 1000,
);

// ==================== GESTIONNAIRES GLOBAUX ====================
// Configuration des gestionnaires d'erreurs globaux
ErrorService.setupGlobalErrorHandlers();

// Gestion des erreurs non capturées (fallback)
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  logger.error("Unhandled Rejection", {
    reason: reason?.message || reason,
    promise,
    stack: reason?.stack,
  });

  if (process.env.NODE_ENV === "production") {
    logger.error("Unhandled Rejection - Application will exit");
    process.exit(1);
  }
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
    name: error.name,
  });

  logger.error("Uncaught Exception - Application will exit");
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

// ==================== EXPORTS ====================
export { app, server };
