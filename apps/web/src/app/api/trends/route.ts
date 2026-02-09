import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { trendService } from '@/lib/services/trend.service';
import { TrendQueryParams } from '@alip/shared-types';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;

  const params: TrendQueryParams = {
    bucketType: sp.get('bucketType') as TrendQueryParams['bucketType'],
    service: sp.get('service') || undefined,
    startDate: sp.get('startDate') || undefined,
    endDate: sp.get('endDate') || undefined,
    limit: sp.get('limit') ? parseInt(sp.get('limit')!) : undefined,
  };

  const trends = await trendService.getTrends(params);
  return successResponse(trends);
});
