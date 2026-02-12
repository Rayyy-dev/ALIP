import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { logService } from '@/lib/services/log.service';

export const GET = withErrorHandling(async (_req: NextRequest, { params }) => {
  const { id } = await params;
  const log = await logService.getLogById(id);
  return successResponse(log);
});
