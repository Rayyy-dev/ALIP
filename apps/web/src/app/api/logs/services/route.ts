import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { logService } from '@/lib/services/log.service';

export const GET = withErrorHandling(async (_req: NextRequest) => {
  const services = await logService.getServices();
  return successResponse(services);
});
