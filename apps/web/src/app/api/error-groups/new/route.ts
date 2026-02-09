import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { errorGroupService } from '@/lib/services/error-grouping.service';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const limit = parseInt(sp.get('limit') || '10') || 10;
  const since = sp.get('since')
    ? new Date(sp.get('since')!)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const groups = await errorGroupService.getNewErrorGroups(since, limit);
  return successResponse(groups);
});
