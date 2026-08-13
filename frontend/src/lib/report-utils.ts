/**
 * Report creation helpers and client-side JSON download.
 */

import { mockAlerts } from '../data/alerts.ts'
import { mockIncidents } from '../data/incidents.ts'
import { mockServices } from '../data/services.ts'
import type { Report, ReportFormInput, ReportMetric, ReportType } from '../types/report.ts'
import { reportTypeLabels } from '../types/report.ts'

export function createReportId(existing: Report[]): string {
  const numbers = existing
    .map((report) => Number.parseInt(report.id.replace(/^rpt-/i, ''), 10))
    .filter((value) => !Number.isNaN(value))

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  return `rpt-${String(next).padStart(3, '0')}`
}

function resolveScopeLabel(scope: string): { label: string; serviceIds?: string[] } {
  if (scope === 'all') {
    return { label: 'All services' }
  }

  const service = mockServices.find((item) => item.id === scope)
  return {
    label: service?.name ?? scope,
    serviceIds: scope ? [scope] : undefined,
  }
}

function buildMetricsForType(type: ReportType): ReportMetric[] {
  switch (type) {
    case 'incident_summary':
      return [
        { label: 'Total Incidents', value: String(mockIncidents.length) },
        {
          label: 'Resolved',
          value: String(mockIncidents.filter((item) => item.status === 'resolved').length),
        },
        {
          label: 'Active',
          value: String(
            mockIncidents.filter((item) => item.status !== 'resolved').length,
          ),
        },
        { label: 'Mean Time to Resolve', value: '4.2h' },
      ]
    case 'service_availability':
      return [
        {
          label: 'Average Uptime',
          value: `${(mockServices.reduce((sum, s) => sum + s.uptime, 0) / mockServices.length).toFixed(2)}%`,
        },
        { label: 'Services Monitored', value: String(mockServices.length) },
        {
          label: 'Degraded Events',
          value: String(mockServices.filter((s) => s.status === 'degraded').length),
        },
        {
          label: 'Down Services',
          value: String(mockServices.filter((s) => s.status === 'down').length),
        },
      ]
    case 'performance':
      return [
        {
          label: 'Avg Response Time',
          value: `${Math.round(mockServices.reduce((sum, s) => sum + s.responseTime, 0) / mockServices.length)} ms`,
        },
        {
          label: 'Fastest Service',
          value: mockServices.reduce((a, b) => (a.responseTime < b.responseTime ? a : b)).name,
        },
        {
          label: 'Slowest Service',
          value: mockServices.reduce((a, b) => (a.responseTime > b.responseTime ? a : b)).name,
        },
        { label: 'Services Analyzed', value: String(mockServices.length) },
      ]
    case 'alert_summary':
      return [
        { label: 'Total Alerts', value: String(mockAlerts.length) },
        {
          label: 'Critical',
          value: String(mockAlerts.filter((a) => a.severity === 'critical').length),
        },
        {
          label: 'Acknowledged',
          value: String(mockAlerts.filter((a) => a.status === 'acknowledged').length),
        },
        {
          label: 'Resolved',
          value: String(mockAlerts.filter((a) => a.status === 'resolved').length),
        },
      ]
    case 'monthly_operations':
      return [
        { label: 'Incidents', value: String(mockIncidents.length) },
        {
          label: 'Avg Uptime',
          value: `${(mockServices.reduce((sum, s) => sum + s.uptime, 0) / mockServices.length).toFixed(2)}%`,
        },
        { label: 'Alerts Fired', value: String(mockAlerts.length) },
        { label: 'Services Monitored', value: String(mockServices.length) },
      ]
  }
}

function buildSummary(type: ReportType, scopeLabel: string): string {
  const typeLabel = reportTypeLabels[type]
  return `${typeLabel} generated for ${scopeLabel}. Metrics compiled from current platform data.`
}

export function createReportFromInput(
  input: ReportFormInput,
  existing: Report[],
  generatedById: string,
): Report {
  const { label, serviceIds } = resolveScopeLabel(input.scope)
  const metrics = buildMetricsForType(input.type)

  return {
    id: createReportId(existing),
    name: input.name,
    type: input.type,
    periodStart: `${input.periodStart}T00:00:00Z`,
    periodEnd: `${input.periodEnd}T23:59:59Z`,
    createdAt: new Date().toISOString(),
    status: 'completed',
    generatedById,
    description: input.description,
    summary: buildSummary(input.type, label),
    scope: label,
    serviceIds,
    metrics,
  }
}

export function downloadReportJson(report: Report): void {
  const payload = {
    name: report.name,
    type: report.type,
    period: { start: report.periodStart, end: report.periodEnd },
    status: report.status,
    scope: report.scope,
    summary: report.summary,
    metrics: report.metrics,
    createdAt: report.createdAt,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${report.name.replace(/\s+/g, '-').toLowerCase()}.json`
  link.click()
  URL.revokeObjectURL(url) // Clean up the temporary object URL
}
