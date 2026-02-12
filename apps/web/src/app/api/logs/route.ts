import { NextRequest } from 'next/server';
import { withErrorHandling, createdResponse, paginatedResponse, parsePaginationParams } from '@/lib/api-utils';
import { logService } from '@/lib/services/log.service';
import type { LogQueryParams } from '@alip/shared-types';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const pagination = parsePaginationParams(sp);

  const params: LogQueryParams = {
    page: pagination.page,
    limit: pagination.limit,
    level: sp.get('level') as LogQueryParams['level'],
    service: sp.get('service') || undefined,
    startDate: sp.get('startDate') || undefined,
    endDate: sp.get('endDate') || undefined,
    search: sp.get('search') || undefined,
    errorGroupId: sp.get('errorGroupId') || undefined,
  };

  const { data, total } = await logService.queryLogs(params);
  return paginatedResponse(data, total, pagination);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();

  if (Array.isArray(body.logs)) {
    const result = await logService.ingestBatch(body);
    return createdResponse(result);
  } else {
    const log = await logService.ingestLog(body);
    return createdResponse({
      id: log.id,
      fingerprint: log.fingerprint,
      normalizedMessage: log.normalizedMessage,
    });
  }
});
