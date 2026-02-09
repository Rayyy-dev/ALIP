import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { trendService } from '@/lib/services/trend.service';

export const GET = withErrorHandling(async (_req: NextRequest) => {
  const currentEnd = new Date();
  const currentStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const previousEnd = currentStart;
  const previousStart = new Date(previousEnd.getTime() - 24 * 60 * 60 * 1000);

  const comparison = await trendService.comparePeriods(
    currentStart,
    currentEnd,
    previousStart,
    previousEnd
  );
  return successResponse(comparison);
});
