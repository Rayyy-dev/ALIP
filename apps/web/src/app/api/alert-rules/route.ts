import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse, createdResponse } from '@/lib/api-utils';
import { alertService } from '@/lib/services/alert.service';

export const GET = withErrorHandling(async (_req: NextRequest) => {
  const rules = await alertService.listRules();
  return successResponse(rules);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const rule = await alertService.createRule(body);
  return createdResponse(rule);
});
