import type { ReportListParams } from '../../types/api/report.ts'
import type { ApiReport, ApiReportStats } from '../../types/api/report.ts'
import type { Report, ReportMetric } from '../../types/report.ts'
import type { ReportFilters, ReportStatsSummary } from '../report-stats.ts'

/** Map backend report to the existing UI Report model. */
export function mapApiReportToReport(api: ApiReport): Report {
  return {
    id: api.id,
    name: api.name,
    type: api.type,
    periodStart: api.period_start,
    periodEnd: api.period_end,
    createdAt: api.created_at,
    status: api.status,
    generatedById: String(api.generated_by_id),
    description: api.description ?? undefined,
    summary: api.summary,
    scope: api.scope,
    serviceIds: api.service_ids?.map(String),
    metrics: api.metrics.map(
      (metric): ReportMetric => ({
        label: metric.label,
        value: metric.value,
      }),
    ),
    scheduledFor: api.scheduled_for ?? undefined,
  }
}

/** Map backend report stats to summary cards. */
export function mapApiReportStatsToReportStats(api: ApiReportStats): ReportStatsSummary {
  return {
    total: api.total,
    incidentReports: api.incident_reports,
    serviceReports: api.service_reports,
    scheduled: api.scheduled,
  }
}

/** Map UI filters to GET /reports query parameters. */
export function buildReportListParams(
  filters: ReportFilters,
  page: number,
  pageSize: number,
): ReportListParams {
  const params: ReportListParams = {
    page,
    page_size: pageSize,
  }

  const search = filters.search.trim()
  if (search.length > 0) {
    params.search = search
  }
  if (filters.type !== 'all') {
    params.type = filters.type
  }
  if (filters.status !== 'all') {
    params.status = filters.status
  }
  if (filters.period !== 'all') {
    params.period = filters.period
  }

  return params
}
