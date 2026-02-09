import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { errorGroupService } from '@/lib/services/error-grouping.service';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { ids, status } = await req.json();
  await errorGroupService.bulkUpdateStatus(ids, status);
  return successResponse({ updated: ids.length });
});
