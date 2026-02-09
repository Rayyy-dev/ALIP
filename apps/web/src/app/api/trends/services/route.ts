import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { trendService } from '@/lib/services/trend.service';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;

  const startDate = sp.get('startDate')
    ? new Date(sp.get('startDate')!)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const endDate = sp.get('endDate')
    ? new Date(sp.get('endDate')!)
    : new Date();

  const metrics = await trendService.getServiceMetrics(startDate, endDate);
  return successResponse(metrics);
});
