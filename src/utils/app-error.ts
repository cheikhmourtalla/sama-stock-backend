// utils/AppError.ts
export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public errorCode: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = "INTERNAL_ERROR",
    details?: any,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.errorCode = errorCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Types d'erreurs prédéfinis
export const ErrorCodes = {
  // Auth errors (1000-1999)
  UNAUTHORIZED: "AUTH_001",
  INVALID_TOKEN: "AUTH_002",
  TOKEN_EXPIRED: "AUTH_003",
  FORBIDDEN: "AUTH_004",
  USER_NOT_FOUND: "AUTH_005",
  INVALID_CREDENTIALS: "AUTH_006",

  // Validation errors (2000-2999)
  VALIDATION_ERROR: "VAL_001",
  MISSING_FIELDS: "VAL_002",
  INVALID_FORMAT: "VAL_003",
  DUPLICATE_ENTRY: "VAL_004",

  // Business errors (3000-3999)
  PRODUCT_NOT_FOUND: "BIZ_001",
  INSUFFICIENT_STOCK: "BIZ_002",
  SALE_NOT_FOUND: "BIZ_003",
  CLIENT_NOT_FOUND: "BIZ_004",
  SUPPLIER_NOT_FOUND: "BIZ_005",

  // Database errors (4000-4999)
  DB_CONNECTION_ERROR: "DB_001",
  DB_QUERY_ERROR: "DB_002",
  DB_DUPLICATE_KEY: "DB_003",

  // External errors (5000-5999)
  EXTERNAL_API_ERROR: "EXT_001",

  // System errors (9000-9999)
  INTERNAL_ERROR: "SYS_001",
  RATE_LIMIT_EXCEEDED: "SYS_002",
} as const;

// export type ErrorCodesTypes = typeof ErrorCodes;
