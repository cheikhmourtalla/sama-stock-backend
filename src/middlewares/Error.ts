// middlewares/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AppError, ErrorCodes } from "../utils/app-error.js";
import loggerService from "../services/logger.service.js";

// Gestionnaire d'erreurs global
export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Récupérer le logger du service
  const errorLogger = loggerService.getLogger("GlobalErrorHandler");
  const requestId = (req as any).requestId || "unknown";

  // Défaut: erreur interne

  let statusCode = 500;
  let errorCode = "INTERNAL_ERROR";
  let message = "Erreur interne du serveur";
  let details: any = null;

  // Si c'est notre erreur personnalisée
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
    details = err.details;
  }

  // Erreurs Mongoose/MongoDB
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Erreur de validation des données";
    errorCode = ErrorCodes.VALIDATION_ERROR;
    details = (err as any).errors;
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Format d'ID invalide";
    errorCode = ErrorCodes.INVALID_FORMAT;
    details = { value: (err as any).value };
  }

  if ((err as any).code === 11000) {
    statusCode = 409;
    message = "Cette valeur existe déjà";
    errorCode = ErrorCodes.DUPLICATE_ENTRY;
    const field = Object.keys((err as any).keyPattern)[0];
    details = { field, value: (err as any).keyValue[field] };
  }

  // Erreurs JWT
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token invalide";
    errorCode = ErrorCodes.INVALID_TOKEN;
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expiré";
    errorCode = ErrorCodes.TOKEN_EXPIRED;
  }

  // Log de l'erreur avec niveau approprié
  const logContext = {
    requestId,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: (req as any).user?.id || "anonymous",
    statusCode,
    errorCode,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  };

  if (statusCode >= 500) {
    // Erreur serveur - log critique
    errorLogger.error(`[${errorCode}] ${message}`, {
      ...logContext,
      originalError: err.message,
      stack: err.stack,
    });
  } else if (statusCode >= 400) {
    // Erreur client - log warning
    errorLogger.warn(`[${errorCode}] ${message}`, logContext);
  }

  // Envoi de la réponse au client
  const responseBody: any = {
    success: false,
    message,
    errorCode,
    requestId,
  };

  // Ajouter les détails en développement
  if (process.env.NODE_ENV === "development") {
    responseBody.details = details || err.message;
    responseBody.stack = err.stack;
  } else if (details && statusCode === 400) {
    // En production, on peut donner quelques détails pour les erreurs 400
    responseBody.details = details;
  }

  res.status(statusCode).json(responseBody);
};

// Middleware pour les routes non trouvées (404)
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const notFoundLogger = loggerService.getLogger("NotFoundHandler");

  notFoundLogger.warn(`Route non trouvée: ${req.method} ${req.originalUrl}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  next(
    new AppError(
      `Route non trouvée: ${req.method} ${req.originalUrl}`,
      404,
      "ROUTE_NOT_FOUND",
    ),
  );
};

// Wrapper pour capturer les erreurs dans les fonctions async
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
