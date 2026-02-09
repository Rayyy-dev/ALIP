import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { errorGroupService } from '@/lib/services/error-grouping.service';

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const includeLogs = req.nextUrl.searchParams.get('includeLogs') !== 'false';
  const group = await errorGroupService.getGroupById(id, includeLogs);
  return successResponse(group);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const body = await req.json();
  const group = await errorGroupService.updateGroupStatus(id, body);
  return successResponse(group);
});
