import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { logService } from '@/lib/services/log.service';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const stats = await logService.getStats(
    sp.get('startDate') || undefined,
    sp.get('endDate') || undefined
  );
  return successResponse(stats);
});
