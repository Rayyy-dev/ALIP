import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { trendService } from '@/lib/services/trend.service';

export const GET = withErrorHandling(async (_req: NextRequest) => {
  const stats = await trendService.getOverviewStats();
  return successResponse(stats);
});
