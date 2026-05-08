import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 3309,
  user: process.env.DATABASE_USER || "root",
  password : '1f2722a99C#',
  // password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "samastock_db",
});

export const prisma = new PrismaClient({ adapter });