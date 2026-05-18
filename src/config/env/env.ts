import "dotenv/config";
import { envSchema } from "./env-schema.js";

// if (process.env.NODE_ENV === "development") {
//   const parsed = envSchema.safeParse(process.env);

//   if (!parsed.success) {
//     console.error("❌ Invalid environment variables:", parsed.error.format());
//     process.exit(1);
//   }
// }

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  port: process.env.PORT || 3000, 
  logLevel: process.env.LOG_LEVEL,
  db: {
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    dbName: process.env.DATABASE_NAME,
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },

  logs: {
    LogLevel: process.env.LOG_LEVEL,
    LogRetentionDay: process.env.LOG_RETENTION_DAYS,
  },
};

console.log(env);
