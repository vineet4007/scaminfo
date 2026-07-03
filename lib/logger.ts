import pino from "pino";

export const logger = pino({
  name: "scaminfo",
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
});
