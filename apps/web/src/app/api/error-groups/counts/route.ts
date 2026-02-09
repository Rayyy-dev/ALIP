import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { errorGroupService } from '@/lib/services/error-grouping.service';

export const GET = withErrorHandling(async (_req: NextRequest) => {
  const counts = await errorGroupService.getGroupCountsByStatus();
  return successResponse(counts);
});
