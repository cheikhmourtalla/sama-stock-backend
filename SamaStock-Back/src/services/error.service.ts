// services/error.service.ts
import { AppError, ErrorCodes } from "../utils/app-error.js";
import loggerService from "./logger.service.js";

export class ErrorService {
  private logger = loggerService.getLogger("ErrorService");

  // Créer une erreur de validation
  static validationError(message: string, details?: any): AppError {
    return new AppError(message, 400, ErrorCodes.VALIDATION_ERROR, details);
  }

  // Créer une erreur 404
  static notFound(resource: string, id?: string): AppError {
    const message = id
      ? `${resource} avec l'ID ${id} non trouvé(e)`
      : `${resource} non trouvé(e)`;
    return new AppError(message, 404, `${resource.toUpperCase()}_NOT_FOUND`);
  }

  // Créer une erreur 401 non autorisé
  static unauthorized(message: string = "Non autorisé"): AppError {
    return new AppError(message, 401, ErrorCodes.UNAUTHORIZED);
  }

  // Créer une erreur 403 interdit
  static forbidden(message: string = "Accès interdit"): AppError {
    return new AppError(message, 403, ErrorCodes.FORBIDDEN);
  }

  // Créer une erreur de stock insuffisant
  static insufficientStock(
    productName: string,
    requested: number,
    available: number,
  ): AppError {
    return new AppError(
      `Stock insuffisant pour ${productName}. Demandé: ${requested}, Disponible: ${available}`,
      400,
      ErrorCodes.INSUFFICIENT_STOCK,
      { productName, requested, available },
    );
  }

  // Créer une erreur de base de données
  static databaseError(operation: string, originalError: any): AppError {
    this.prototype.logger.error(`Database error during ${operation}`, {
      operation,
      error: originalError.message,
    });

    return new AppError(
      `Erreur base de données lors de ${operation}`,
      500,
      ErrorCodes.DB_QUERY_ERROR,
      process.env.NODE_ENV === "development"
        ? { originalError: originalError.message }
        : undefined,
    );
  }

  // Gérer les erreurs promises non capturées
  static setupGlobalErrorHandlers() {
    process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
      const errorLogger = loggerService.getLogger("UnhandledRejection");
      errorLogger.error("Promise rejection non gérée", {
        reason: reason?.message || reason,
        stack: reason?.stack,
        promise,
      });

      // En production, on peut fermer proprement
      if (process.env.NODE_ENV === "production") {
        console.error("Unhandled Rejection - Arrêt du serveur...");
        process.exit(1);
      }
    });

    process.on("uncaughtException", (error: Error) => {
      const errorLogger = loggerService.getLogger("UncaughtException");
      errorLogger.error("Exception non capturée", {
        error: error.message,
        stack: error.stack,
        name: error.name,
      });

      // Nécessaire de fermer pour les exceptions non capturées
      console.error("Uncaught Exception - Arrêt du serveur...");
      process.exit(1);
    });

    // Signaux de terminaison
    process.on("SIGTERM", () => {
      const logger = loggerService.getLogger("Process");
      logger.info("Signal SIGTERM reçu - Arrêt du serveur");
      process.exit(0);
    });

    process.on("SIGINT", () => {
      const logger = loggerService.getLogger("Process");
      logger.info("Signal SIGINT reçu - Arrêt du serveur");
      process.exit(0);
    });
  }
}
