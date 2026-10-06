import "dotenv/config";

export const env = {
  port: Number(process.env.PORT) || 3333,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "dev-secret",
  jwtAccessTtl: process.env.JWT_ACCESS_TTL || "15m",
  refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS) || 30,
};
