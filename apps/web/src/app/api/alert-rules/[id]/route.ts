import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse, noContentResponse } from '@/lib/api-utils';
import { alertService } from '@/lib/services/alert.service';

export const GET = withErrorHandling(async (_req: NextRequest, { params }) => {
  const { id } = await params;
  const rule = await alertService.getRuleById(id);
  return successResponse(rule);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const body = await req.json();
  const rule = await alertService.updateRule(id, body);
  return successResponse(rule);
});

export const DELETE = withErrorHandling(async (_req: NextRequest, { params }) => {
  const { id } = await params;
  await alertService.deleteRule(id);
  return noContentResponse();
});
