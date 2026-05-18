import "dotenv/config";
import { PrismaClient } from "../prisma/generated/prisma/client.js"; // path depends on your output setting
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env/env";

PrismaClient;

const adapter = new PrismaPg({
  connectionString: env.db.url,
  // ssl: { rejectUnauthorized: false },
});

export const prisma = new PrismaClient({ adapter });
