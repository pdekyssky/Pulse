/**
 * Report list filtering, sorting, and summary stats.
 */

import type { Report, ReportStatus, ReportType } from '../types/report.ts'

export interface ReportStatsSummary {
  total: number
  incidentReports: number
  serviceReports: number
  scheduled: number
}

export function computeReportStats(reports: Report[]): ReportStatsSummary {
  return {
    total: reports.length,
    incidentReports: reports.filter((report) => report.type === 'incident_summary').length,
    serviceReports: reports.filter(
      (report) =>
        report.type === 'service_availability' || report.type === 'performance',
    ).length,
    scheduled: reports.filter((report) => report.status === 'scheduled').length,
  }
}

export type ReportFilterType = ReportType | 'all'

export type ReportFilterStatus = ReportStatus | 'all'

export type ReportFilterPeriod = 'all' | 'last_7_days' | 'last_30_days' | 'last_90_days'

export interface ReportFilters {
  search: string
  type: ReportFilterType
  status: ReportFilterStatus
  period: ReportFilterPeriod
}

export const defaultReportFilters: ReportFilters = {
  search: '',
  type: 'all',
  status: 'all',
  period: 'all',
}

const periodDays: Record<Exclude<ReportFilterPeriod, 'all'>, number> = {
  last_7_days: 7,
  last_30_days: 30,
  last_90_days: 90,
}

function matchesPeriod(report: Report, period: ReportFilterPeriod): boolean {
  if (period === 'all') {
    return true
  }

  const cutoff = Date.now() - periodDays[period] * 86_400_000
  return new Date(report.createdAt).getTime() >= cutoff
}

export function filterReports(reports: Report[], filters: ReportFilters): Report[] {
  const search = filters.search.trim().toLowerCase()

  return reports.filter((report) => {
    const matchesSearch =
      search.length === 0 ||
      report.name.toLowerCase().includes(search) ||
      report.summary.toLowerCase().includes(search) ||
      report.scope.toLowerCase().includes(search)

    const matchesType = filters.type === 'all' || report.type === filters.type
    const matchesStatus = filters.status === 'all' || report.status === filters.status
    const matchesPeriodFilter = matchesPeriod(report, filters.period)

    return matchesSearch && matchesType && matchesStatus && matchesPeriodFilter
  })
}

export function sortReports(reports: Report[]): Report[] {
  const statusOrder: Record<ReportStatus, number> = {
    generating: 0,
    scheduled: 1,
    failed: 2,
    completed: 3,
  }

  return [...reports].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) {
      return statusDiff
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
