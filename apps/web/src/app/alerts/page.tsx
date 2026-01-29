'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Pagination } from '@/components/ui/data-table';
import { PageLoading } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-display';
import { EmptyState } from '@/components/ui/empty-state';
import {
  getAlerts,
  getAlertSummary,
  getAlertRules,
  updateAlert,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
} from '@/lib/api';
import { formatRelativeTime, truncate } from '@/lib/utils';
import {
  Bell,
  BellOff,
  Check,
  Eye,
  Plus,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';

interface Alert {
  id: string;
  alertRuleId: string;
  status: string;
  message: string;
  metadata: unknown;
  triggeredAt: string;
  resolvedAt: string | null;
  alertRule: {
    id: string;
    name: string;
    ruleType: string;
  };
}

interface AlertRule {
  id: string;
  name: string;
  description: string | null;
  ruleType: string;
  threshold: number;
  windowMinutes: number;
  service: string | null;
  enabled: boolean;
}

interface AlertSummary {
  activeCount: number;
  acknowledgedCount: number;
  resolvedTodayCount: number;
}

/**
 * Alerts page
 * Manage alerts and alert rules
 */
export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules'>('alerts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [alertsResponse, rulesData, summaryData] = await Promise.all([
        getAlerts({
          page: pagination.page,
          limit: pagination.limit,
          status: statusFilter || undefined,
        }),
        getAlertRules(),
        getAlertSummary(),
      ]);

      setAlerts(alertsResponse.data);
      setPagination((prev) => ({
        ...prev,
        total: alertsResponse.pagination.total,
        totalPages: alertsResponse.pagination.totalPages,
      }));
      setRules(rulesData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAlertStatusUpdate = async (id: string, status: string) => {
    try {
      await updateAlert(id, status);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      fetchData(); // Refresh summary
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update alert');
    }
  };

  const handleRuleToggle = async (rule: AlertRule) => {
    try {
      await updateAlertRule(rule.id, { enabled: !rule.enabled });
      setRules((prev) =>
        prev.map((r) =>
          r.id === rule.id ? { ...r, enabled: !r.enabled } : r
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update rule');
    }
  };

  const handleRuleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await deleteAlertRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete rule');
    }
  };

  const handleRuleSave = async (data: {
    name: string;
    description?: string;
    ruleType: string;
    threshold: number;
    windowMinutes: number;
    service?: string;
  }) => {
    try {
      if (editingRule) {
        await updateAlertRule(editingRule.id, data);
      } else {
        await createAlertRule(data);
      }
      setShowRuleModal(false);
      setEditingRule(null);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save rule');
    }
  };

  const alertColumns = [
    {
      key: 'message',
      header: 'Alert',
      render: (item: Alert) => (
        <div>
          <p className="text-white">{truncate(item.message, 60)}</p>
          <p className="text-xs text-[--text-tertiary] mt-1">{item.alertRule.name}</p>
        </div>
      ),
    },
    {
      key: 'ruleType',
      header: 'Type',
      render: (item: Alert) => (
        <span className="text-sm text-[--text-secondary]">
          {item.alertRule.ruleType.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Alert) => (
        <Badge variant="status" status={item.status}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'triggeredAt',
      header: 'Triggered',
      render: (item: Alert) => (
        <span className="text-sm text-[--text-tertiary]">
          {formatRelativeTime(item.triggeredAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: Alert) => (
        <div className="flex gap-1">
          {item.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => handleAlertStatusUpdate(item.id, 'ACKNOWLEDGED')}
                className="p-1 text-warning-400 hover:bg-warning-500/10 rounded"
                title="Acknowledge"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleAlertStatusUpdate(item.id, 'RESOLVED')}
                className="p-1 text-success-400 hover:bg-success-500/10 rounded"
                title="Resolve"
              >
                <Check className="w-4 h-4" />
              </button>
            </>
          )}
          {item.status === 'ACKNOWLEDGED' && (
            <button
              onClick={() => handleAlertStatusUpdate(item.id, 'RESOLVED')}
              className="p-1 text-success-400 hover:bg-success-500/10 rounded"
              title="Resolve"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading && alerts.length === 0) {
    return <PageLoading />;
  }

  if (error && alerts.length === 0) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  return (
    <div>
      <Header
        title="Alerts"
        description="Monitor and manage alert rules and notifications"
        onRefresh={fetchData}
        isLoading={isLoading}
        actions={
          <button
            onClick={() => {
              setEditingRule(null);
              setShowRuleModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Rule
          </button>
        }
      />

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Active Alerts"
            value={summary.activeCount}
            icon={Bell}
            accent="rose"
          />
          <StatCard
            title="Acknowledged"
            value={summary.acknowledgedCount}
            icon={Eye}
            accent="amber"
          />
          <StatCard
            title="Resolved Today"
            value={summary.resolvedTodayCount}
            icon={Check}
            accent="emerald"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[--border-subtle] mb-6">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-4 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'alerts'
                ? 'border-primary-400 text-primary-300'
                : 'border-transparent text-[--text-disabled] hover:text-[--text-tertiary]'
            }`}
          >
            Alerts
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-4 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'rules'
                ? 'border-primary-400 text-primary-300'
                : 'border-transparent text-[--text-disabled] hover:text-[--text-tertiary]'
            }`}
          >
            Alert Rules ({rules.length})
          </button>
        </nav>
      </div>

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <>
          {/* Filter */}
          <div className="mb-6">
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          {/* Alerts Table */}
          <div className="card">
            {alerts.length > 0 ? (
              <>
                <DataTable
                  columns={alertColumns}
                  data={alerts}
                  keyExtractor={(item) => item.id}
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
                icon={BellOff}
                title="No alerts found"
                description="No alerts match the current filter"
              />
            )}
          </div>
        </>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="card">
          {rules.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Rule Name</th>
                  <th>Type</th>
                  <th>Threshold</th>
                  <th>Window</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <div>
                        <p className="font-medium text-white">{rule.name}</p>
                        {rule.description && (
                          <p className="text-xs text-[--text-tertiary]">
                            {rule.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="text-sm text-[--text-secondary]">
                      {rule.ruleType.replace(/_/g, ' ')}
                    </td>
                    <td className="font-medium">{rule.threshold}</td>
                    <td className="text-sm text-[--text-secondary]">
                      {rule.windowMinutes} min
                    </td>
                    <td className="text-sm text-[--text-secondary]">
                      {rule.service || 'All'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleRuleToggle(rule)}
                        className={`badge ${
                          rule.enabled ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingRule(rule);
                            setShowRuleModal(true);
                          }}
                          className="p-1 text-[--text-secondary] hover:bg-white/[0.04] rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRuleDelete(rule.id)}
                          className="p-1 text-danger-400 hover:bg-danger-500/10 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="No alert rules"
              description="Create an alert rule to start monitoring"
              action={
                <button
                  onClick={() => setShowRuleModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Rule
                </button>
              }
            />
          )}
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <RuleModal
          rule={editingRule}
          onSave={handleRuleSave}
          onClose={() => {
            setShowRuleModal(false);
            setEditingRule(null);
          }}
        />
      )}
    </div>
  );
}

interface RuleModalProps {
  rule: AlertRule | null;
  onSave: (data: {
    name: string;
    description?: string;
    ruleType: string;
    threshold: number;
    windowMinutes: number;
    service?: string;
  }) => void;
  onClose: () => void;
}

function RuleModal({ rule, onSave, onClose }: RuleModalProps) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    ruleType: rule?.ruleType || 'ERROR_COUNT_THRESHOLD',
    threshold: rule?.threshold || 10,
    windowMinutes: rule?.windowMinutes || 60,
    service: rule?.service || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      service: formData.service || undefined,
      description: formData.description || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[--surface-elevated] border border-[--border-default] rounded-lg shadow-dark-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-[--border-subtle]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {rule ? 'Edit Alert Rule' : 'Create Alert Rule'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/[0.04] rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[--text-tertiary] mb-1">
                Rule Name
              </label>
              <input
                type="text"
                className="input w-full"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[--text-tertiary] mb-1">
                Description
              </label>
              <input
                type="text"
                className="input w-full"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[--text-tertiary] mb-1">
                Rule Type
              </label>
              <select
                className="select w-full"
                value={formData.ruleType}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ruleType: e.target.value }))
                }
              >
                <option value="ERROR_COUNT_THRESHOLD">
                  Error Count Threshold
                </option>
                <option value="SPIKE_DETECTION">Spike Detection</option>
                <option value="NEW_ERROR_TYPE">New Error Type</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[--text-tertiary] mb-1">
                  Threshold
                </label>
                <input
                  type="number"
                  className="input w-full"
                  value={formData.threshold}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      threshold: parseInt(e.target.value),
                    }))
                  }
                  min={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[--text-tertiary] mb-1">
                  Window (minutes)
                </label>
                <input
                  type="number"
                  className="input w-full"
                  value={formData.windowMinutes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      windowMinutes: parseInt(e.target.value),
                    }))
                  }
                  min={1}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[--text-tertiary] mb-1">
                Service (optional)
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="All services"
                value={formData.service}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, service: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="p-6 border-t border-[--border-subtle] flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {rule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
