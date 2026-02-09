export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  defaultPageSize: 20,
  maxPageSize: 100,
  defaultAlertWindow: 60,
  trendRetentionDays: 90,
} as const;
