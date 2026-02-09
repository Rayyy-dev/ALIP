import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { alertService } from '@/lib/services/alert.service';

export const GET = withErrorHandling(async (_req: NextRequest, { params }) => {
  const { id } = await params;
  const alert = await alertService.getAlertById(id);
  return successResponse(alert);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const body = await req.json();
  const alert = await alertService.updateAlert(id, body);
  return successResponse(alert);
});
