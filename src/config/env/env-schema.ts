import { z } from "zod";

export const envSchema = z.object({
  // Environnement
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_USER: z.string("database username manquant"),
  DATABASE_PASSWORD: z.string(),
  DATABASE_NAME: z.string(
    "Nom base de donnee non definit ou contient une erreur",
  ),
  DATABASE_URL: z.string(),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(3306),
  LOG_LEVEL: z.string().default("debug"),
  LOG_RETENTION_DAYS: z.string().default("30"),
  // Auth
  JWT_SECRET: z
    .string()
    .min(32, "Le secret JWT doit faire au moins 32 caractères"),
});
