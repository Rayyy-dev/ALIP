import { NextRequest } from 'next/server';
import { withErrorHandling, paginatedResponse, parsePaginationParams } from '@/lib/api-utils';
import { errorGroupService } from '@/lib/services/error-grouping.service';
import { ErrorGroupQueryParams } from '@alip/shared-types';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const pagination = parsePaginationParams(sp);

  const params: ErrorGroupQueryParams = {
    page: pagination.page,
    limit: pagination.limit,
    status: sp.get('status') as ErrorGroupQueryParams['status'],
    service: sp.get('service') || undefined,
    level: sp.get('level') as ErrorGroupQueryParams['level'],
    sortBy: sp.get('sortBy') as ErrorGroupQueryParams['sortBy'],
    sortOrder: sp.get('sortOrder') as ErrorGroupQueryParams['sortOrder'],
    search: sp.get('search') || undefined,
  };

  const { data, total } = await errorGroupService.queryGroups(params);
  return paginatedResponse(data, total, pagination);
});
