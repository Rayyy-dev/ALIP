import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { errorGroupService } from '@/lib/services/error-grouping.service';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const limit = parseInt(sp.get('limit') || '10') || 10;
  const service = sp.get('service') || undefined;
  const groups = await errorGroupService.getTopRecurringErrors(limit, service);
  return successResponse(groups);
});
