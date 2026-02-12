import { NextRequest } from 'next/server';
import { withErrorHandling, paginatedResponse, parsePaginationParams } from '@/lib/api-utils';
import { alertService } from '@/lib/services/alert.service';
import type { AlertQueryParams } from '@alip/shared-types';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const pagination = parsePaginationParams(sp);

  const params: AlertQueryParams = {
    page: pagination.page,
    limit: pagination.limit,
    status: sp.get('status') as AlertQueryParams['status'],
    ruleType: sp.get('ruleType') as AlertQueryParams['ruleType'],
    startDate: sp.get('startDate') || undefined,
    endDate: sp.get('endDate') || undefined,
  };

  const { data, total } = await alertService.queryAlerts(params);
  return paginatedResponse(data, total, pagination);
});
