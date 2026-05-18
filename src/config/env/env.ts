import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production" ? true : false;
export const env = {
  port: process.env.PORT || 3000,
  logLevel: process.env.LOG_LEVEL,
  db: {
    url: isProduction ? process.env.PROD_URL : process.env.DATABASE_URL ,
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
