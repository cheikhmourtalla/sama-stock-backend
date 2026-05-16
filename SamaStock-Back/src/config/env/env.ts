import dotenv from "dotenv";
import { envSchema } from "./env-schema";
dotenv.config();
// Validation immédiate
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = {
  isProduction: parsed.data.NODE_ENV === "production",
  isDevelopment: parsed.data.NODE_ENV === "development",
  port: parsed.data.PORT,
  logLevel: parsed.data.LOG_LEVEL,
  db: {
    username: parsed.data.DATABASE_USER,
    password: parsed.data.DATABASE_PASSWORD,
    dbName: parsed.data.DATABASE_NAME,
    url: parsed.data.DATABASE_URL,
    host: parsed.data.DB_HOST,
    port: parsed.data.DB_PORT,
  },
  jwt: {
    secret: parsed.data.JWT_SECRET,
  },
};

// console.log(env);
