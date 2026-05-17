

// // errorMiddleware.js
// const logger = require('./logger'); // Optionnel: votre système de logging

// // Classe d'erreur personnalisée
// class AppError extends Error {
//   constructor(message, statusCode, errorCode = null) {
//     super(message);
//     this.statusCode = statusCode;
//     this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
//     this.isOperational = true;
//     this.errorCode = errorCode;
    
//     Error.captureStackTrace(this, this.constructor);
//   }
// }

// // Middleware pour les routes non trouvées (404)
// const notFound = (req, res, next) => {
//   const error = new AppError(`Route non trouvée: ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND');
//   next(error);
// };

// // Gestion des erreurs spécifiques MongoDB/Mongoose
// const handleDuplicateKeyError = (err) => {
//   const field = Object.keys(err.keyPattern)[0];
//   const value = err.keyValue[field];
//   return new AppError(
//     `La valeur '${value}' pour le champ '${field}' existe déjà. Veuillez utiliser une autre valeur.`,
//     409,
//     'DUPLICATE_KEY_ERROR'
//   );
// };

// const handleValidationError = (err) => {
//   const errors = Object.values(err.errors).map(e => e.message);
//   const message = `Erreur de validation: ${errors.join('. ')}`;
//   return new AppError(message, 400, 'VALIDATION_ERROR');
// };

// const handleCastError = (err) => {
//   const message = `ID invalide: ${err.value}. Format incorrect.`;
//   return new AppError(message, 400, 'INVALID_ID_FORMAT');
// };

// const handleJWTError = () => new AppError('Token invalide. Veuillez vous reconnecter.', 401, 'JWT_INVALID');
// const handleJWTExpiredError = () => new AppError('Token expiré. Veuillez vous reconnecter.', 401, 'JWT_EXPIRED');

// // Middleware principal de gestion des erreurs
// const errorHandler = (err, req, res, next) => {
//   let error = { ...err };
//   error.message = err.message;
//   error.statusCode = err.statusCode || 500;
  
//   // Logging de l'erreur
//   if (process.env.NODE_ENV === 'development') {
//     console.error('ERROR ❌:', err);
//   } else {
//     // En production, log uniquement les erreurs critiques
//     if (error.statusCode === 500) {
//       logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
//     } else {
//       logger.warn(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
//     }
//   }
  
//   // Gestion des erreurs spécifiques
//   if (err.code === 11000) error = handleDuplicateKeyError(err);
//   if (err.name === 'ValidationError') error = handleValidationError(err);
//   if (err.name === 'CastError') error = handleCastError(err);
//   if (err.name === 'JsonWebTokenError') error = handleJWTError();
//   if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  
//   // Envoi de la réponse
//   if (process.env.NODE_ENV === 'development') {
//     // Mode développement: erreur détaillée
//     res.status(error.statusCode).json({
//       success: false,
//       status: error.status,
//       statusCode: error.statusCode,
//       message: error.message,
//       errorCode: error.errorCode,
//       stack: err.stack,
//       error: err
//     });
//   } else {
//     // Mode production: messages plus sûrs
//     if (error.isOperational) {
//       // Erreurs opérationnelles: message client-friendly
//       res.status(error.statusCode).json({
//         success: false,
//         status: error.status,
//         message: error.message,
//         errorCode: error.errorCode
//       });
//     } else {
//       // Erreurs de programmation: message générique
//       console.error('ERREUR PROGRAMMATION:', err);
//       res.status(500).json({
//         success: false,
//         status: 'error',
//         message: 'Une erreur interne est survenue',
//         errorCode: 'INTERNAL_SERVER_ERROR'
//       });
//     }
//   }
// };

// // Middleware pour capturer les rejets de promesses non gérés
// const unhandledRejectionHandler = () => {
//   process.on('unhandledRejection', (err) => {
//     console.error('PROMESSE NON GÉRÉE ❌:', err);
//     logger.error(`UNHANDLED REJECTION: ${err.message}`, { stack: err.stack });
    
//     // Option: fermer proprement l'application
//     // server.close(() => process.exit(1));
//   });
// };

// // Middleware pour capturer les exceptions non capturées
// const uncaughtExceptionHandler = () => {
//   process.on('uncaughtException', (err) => {
//     console.error('EXCEPTION NON CAPTURÉE ❌:', err);
//     logger.error(`UNCAUGHT EXCEPTION: ${err.message}`, { stack: err.stack });
    
//     // Fermer proprement l'application
//     process.exit(1);
//   });
// };

// // Module d'initialisation des gestionnaires
// const setupErrorHandlers = () => {
//   unhandledRejectionHandler();
//   uncaughtExceptionHandler();
// };

// module.exports = {
//   AppError,
//   notFound,
//   errorHandler,
//   setupErrorHandlers
// };