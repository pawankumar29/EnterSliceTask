import dotenv from "dotenv";

dotenv.config();

const numberFromEnv = (key, fallback) => {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (Number.isNaN(value)) throw new Error(`${key} must be a number`);
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: numberFromEnv("PORT", 4000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: numberFromEnv("DB_PORT", 3306),
    database:
      process.env.DB_NAME || process.env.MYSQL_DATABASE || "support_sla",
    user: process.env.DB_USER || process.env.MYSQL_USER || "support_user",
    password:
      process.env.DB_PASSWORD ||
      process.env.MYSQL_PASSWORD ||
      "support_password",
  },

   sla: {
    windowsHours: {
      low: numberFromEnv("SLA_LOW_HOURS", 72),
      medium: numberFromEnv("SLA_MEDIUM_HOURS", 24),
      high: numberFromEnv("SLA_HIGH_HOURS", 8),
      urgent: numberFromEnv("SLA_URGENT_HOURS", 2),
    },
  }

};
