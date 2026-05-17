import "dotenv/config";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger-config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";

// Import du système de logging
import { logger } from "./config/logger-config";
import loggerService from "./services/logger.service";
import {
  requestLogger,
  errorLogger,
  performanceLogger,
  rateLimitedLogger,
} from "./middlewares/logger.middleware";

// Import des routes
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import stockRoutes from "./routes/stock.routes";
import saleRoutes from "./routes/sale.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import clientRoutes from "./routes/client.routes";
import supplierRoute from "./routes/supplier.route";
import cashRoutes from "./routes/cash.routes";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ==================== MIDDLEWARES GLOBAUX ====================

// Logging des requêtes (DOIT être le premier middleware)
app.use(requestLogger);
app.use(performanceLogger(3000)); // Log les requêtes lentes (>3s)
app.use(rateLimitedLogger(200)); // Limite à 200 logs par minute par IP

// Middlewares standards
app.use(cors());
app.use(express.json());
app.use(helmet());

// Log des requêtes HTTP avec Morgan (optionnel, en complément)
// Note: On garde morgan mais on le configure pour utiliser Winston
import morgan from "morgan";
import { stream } from "./config/logger-config";

// Configuration de morgan pour utiliser Winston
app.use(morgan("combined", { stream }));

// ==================== DOCUMENTATION SWAGGER ====================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== ROUTE PRINCIPALE ====================
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

// ==================== ROUTES API ====================
// Route de santé pour le monitoring
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
  });
});

// Routes de l'application
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/suppliers", supplierRoute);
app.use("/api/cash", cashRoutes);

// ==================== GESTION DES ERREURS ====================

// Middleware pour les routes non trouvées (404)
app.use((req: Request, res: Response) => {
  const serviceLogger = loggerService.getLogger("NotFoundHandler");
  serviceLogger.warn(`Route non trouvée: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
    requestId: req.requestId,
  });

  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.originalUrl}`,
    requestId: req.requestId,
  });
});

// Middleware de gestion d'erreurs global (DOIT être le dernier middleware)
app.use(errorLogger);
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Erreur interne du serveur";

  // Log détaillé de l'erreur
  const serviceLogger = loggerService.getLogger("GlobalErrorHandler");
  serviceLogger.error(`Erreur ${statusCode}: ${message}`, {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    stack: err.stack,
    errorCode: err.code,
  });

  // Envoi de la réponse appropriée
  res.status(statusCode).json({
    success: false,
    message,
    requestId: req.requestId,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err.details,
    }),
  });
});

// ==================== DÉMARRAGE DU SERVEUR ====================

// Log des informations système au démarrage
loggerService.logSystemInfo();

// Planifier le nettoyage des logs toutes les 24h
setInterval(
  () => {
    loggerService.cleanupOldLogs(30);
    loggerService.logPerformanceMetrics();
  },
  24 * 60 * 60 * 1000,
);

// Planifier les métriques toutes les heures
setInterval(
  () => {
    loggerService.logPerformanceMetrics();
  },
  60 * 60 * 1000,
);

// Gestion des erreurs non capturées
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  logger.error("Unhandled Rejection", {
    reason: reason?.message || reason,
    promise,
    stack: reason?.stack,
  });

  // En production, on peut choisir de fermer l'application
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

  // Nécessaire de fermer l'application pour les exceptions non capturées
  logger.error("Uncaught Exception - Application will exit");
  process.exit(1);
});

// Signaux de terminaison
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

// Démarrage du serveur
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

// Export pour les tests
export { app, server };
