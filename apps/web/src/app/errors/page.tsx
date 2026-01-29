'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { DataTable, Pagination } from '@/components/ui/data-table';
import { PageLoading } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-display';
import { EmptyState } from '@/components/ui/empty-state';
import { getErrorGroups, getServices, updateErrorGroup } from '@/lib/api';
import { formatNumber, formatRelativeTime, truncate } from '@/lib/utils';
import { AlertTriangle, Check, X, EyeOff } from 'lucide-react';

interface ErrorGroup {
  id: string;
  fingerprint: string;
  normalizedMessage: string;
  service: string;
  level: string;
  occurrenceCount: number;
  firstSeen: string;
  lastSeen: string;
  status: string;
}

interface Filters {
  status: string;
  service: string;
  level: string;
  search: string;
}

/**
 * Error Groups page
 * Lists and manages grouped error patterns
 */
export default function ErrorGroupsPage() {
  const [errorGroups, setErrorGroups] = useState<ErrorGroup[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Filters>({
    status: '',
    service: '',
    level: '',
    search: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ErrorGroup | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [groupsResponse, servicesData] = await Promise.all([
        getErrorGroups({
          page: pagination.page,
          limit: pagination.limit,
          status: filters.status || undefined,
          service: filters.service || undefined,
          level: filters.level || undefined,
          search: filters.search || undefined,
          sortBy: 'lastSeen',
          sortOrder: 'desc',
        }),
        getServices(),
      ]);

      setErrorGroups(groupsResponse.data);
      setPagination((prev) => ({
        ...prev,
        total: groupsResponse.pagination.total,
        totalPages: groupsResponse.pagination.totalPages,
      }));
      setServices(servicesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateErrorGroup(id, status);
      setErrorGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, status } : g))
      );
      setSelectedGroup(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const columns = [
    {
      key: 'normalizedMessage',
      header: 'Error Message',
      className: 'max-w-md',
      render: (item: ErrorGroup) => (
        <div>
          <p
            className="text-white cursor-pointer hover:text-primary-300"
            onClick={() => setSelectedGroup(item)}
          >
            {truncate(item.normalizedMessage, 80)}
          </p>
          <p className="text-xs text-[--text-tertiary] mt-1">
            Fingerprint: {item.fingerprint}
          </p>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service',
      render: (item: ErrorGroup) => (
        <span className="text-sm text-[--text-secondary]">{item.service}</span>
      ),
    },
    {
      key: 'level',
      header: 'Level',
      render: (item: ErrorGroup) => (
        <Badge variant="level" level={item.level}>
          {item.level}
        </Badge>
      ),
    },
    {
      key: 'occurrenceCount',
      header: 'Count',
      className: 'text-right',
      render: (item: ErrorGroup) => (
        <span className="font-medium">{formatNumber(item.occurrenceCount)}</span>
      ),
    },
    {
      key: 'lastSeen',
      header: 'Last Seen',
      className: 'text-right',
      render: (item: ErrorGroup) => (
        <span className="text-sm text-[--text-tertiary]">
          {formatRelativeTime(item.lastSeen)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: ErrorGroup) => (
        <Badge variant="status" status={item.status}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: ErrorGroup) => (
        <div className="flex gap-1">
          {item.status !== 'RESOLVED' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusUpdate(item.id, 'RESOLVED');
              }}
              className="p-1 text-success-400 hover:bg-success-500/10 rounded"
              title="Mark as Resolved"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {item.status !== 'IGNORED' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusUpdate(item.id, 'IGNORED');
              }}
              className="p-1 text-[--text-secondary] hover:bg-white/[0.04] rounded"
              title="Ignore"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          )}
          {item.status !== 'ACTIVE' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusUpdate(item.id, 'ACTIVE');
              }}
              className="p-1 text-danger-400 hover:bg-danger-500/10 rounded"
              title="Reactivate"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading && errorGroups.length === 0) {
    return <PageLoading />;
  }

  if (error && errorGroups.length === 0) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  return (
    <div>
      <Header
        title="Error Groups"
        description="Grouped error patterns from your applications"
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[--text-tertiary] mb-1">
                Status
              </label>
              <select
                className="select w-full"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="RESOLVED">Resolved</option>
                <option value="IGNORED">Ignored</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[--text-tertiary] mb-1">
                Service
              </label>
              <select
                className="select w-full"
                value={filters.service}
                onChange={(e) => handleFilterChange('service', e.target.value)}
              >
                <option value="">All Services</option>
                {services.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[--text-tertiary] mb-1">
                Level
              </label>
              <select
                className="select w-full"
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="ERROR">Error</option>
                <option value="WARN">Warning</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[--text-tertiary] mb-1">
                Search
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="Search messages..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {errorGroups.length > 0 ? (
          <>
            <DataTable
              columns={columns}
              data={errorGroups}
              keyExtractor={(item) => item.id}
              onRowClick={setSelectedGroup}
            />
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={(page) =>
                setPagination((prev) => ({ ...prev, page }))
              }
            />
          </>
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title="No error groups found"
            description="Adjust your filters or wait for logs to be ingested"
          />
        )}
      </div>

      {/* Detail Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[--surface-elevated] border border-[--border-default] rounded-lg shadow-dark-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-[--border-subtle]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Error Group Details
                  </h2>
                  <p className="text-sm text-[--text-tertiary] mt-1">
                    {selectedGroup.fingerprint}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="p-2 hover:bg-white/[0.04] rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[--text-tertiary]">
                    Normalized Message
                  </label>
                  <p className="mt-1 text-[--text-secondary] font-mono text-sm bg-[--surface-deep] border border-[--border-subtle] rounded-lg p-3">
                    {selectedGroup.normalizedMessage}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[--text-tertiary]">
                      Service
                    </label>
                    <p className="mt-1 text-white">{selectedGroup.service}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[--text-tertiary]">
                      Level
                    </label>
                    <p className="mt-1">
                      <Badge variant="level" level={selectedGroup.level}>
                        {selectedGroup.level}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[--text-tertiary]">
                      Occurrence Count
                    </label>
                    <p className="mt-1 text-white font-medium">
                      {formatNumber(selectedGroup.occurrenceCount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[--text-tertiary]">
                      Status
                    </label>
                    <p className="mt-1">
                      <Badge variant="status" status={selectedGroup.status}>
                        {selectedGroup.status}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[--text-tertiary]">
                      First Seen
                    </label>
                    <p className="mt-1 text-white">
                      {formatRelativeTime(selectedGroup.firstSeen)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[--text-tertiary]">
                      Last Seen
                    </label>
                    <p className="mt-1 text-white">
                      {formatRelativeTime(selectedGroup.lastSeen)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[--border-subtle] flex gap-3 justify-end">
              <button
                onClick={() => setSelectedGroup(null)}
                className="btn-secondary"
              >
                Close
              </button>
              {selectedGroup.status !== 'RESOLVED' && (
                <button
                  onClick={() =>
                    handleStatusUpdate(selectedGroup.id, 'RESOLVED')
                  }
                  className="btn-primary"
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
