import "dotenv/config";
import { defineConfig } from "prisma/config";
import { env } from "./src/config/env/env.js";

console.log(env.db.url);

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env.db.url,
  },
});
