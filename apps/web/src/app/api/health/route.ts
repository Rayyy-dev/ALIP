import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { testConnection } from '@/lib/db';

export const GET = withErrorHandling(async (_req: NextRequest) => {
  const startTime = performance.now();
  const dbConnected = await testConnection();
  const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;

  return successResponse({
    status: dbConnected ? 'healthy' : 'unhealthy',
    version: '1.0.0',
    database: { connected: dbConnected, latencyMs },
  });
});
