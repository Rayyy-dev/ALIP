import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { alertService } from '@/lib/services/alert.service';

export const GET = withErrorHandling(async (_req: NextRequest) => {
  const summary = await alertService.getAlertSummary();
  return successResponse(summary);
});
