/**
 * Client-side JSON/CSV download for incident reports.
 */

import type { IncidentReportRow } from './mappers/report.ts'

function triggerDownload(filename: string, contents: string, type: string): void {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadIncidentReportJson(rows: IncidentReportRow[]): void {
  triggerDownload(
    `pulse-incident-report-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(rows, null, 2),
    'application/json',
  )
}

function csvValue(value: string | number | null): string {
  const text = value === null ? '' : String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function downloadIncidentReportCsv(rows: IncidentReportRow[]): void {
  const header = [
    'id',
    'title',
    'severity',
    'status',
    'service',
    'assignee',
    'created_at',
    'resolved_at',
  ]
  const lines = [
    header.join(','),
    ...rows.map((row) =>
      [
        row.id,
        row.title,
        row.severity,
        row.status,
        row.serviceName,
        row.assignedToName,
        row.createdAt,
        row.resolvedAt,
      ]
        .map(csvValue)
        .join(','),
    ),
  ]

  triggerDownload(
    `pulse-incident-report-${new Date().toISOString().slice(0, 10)}.csv`,
    lines.join('\n'),
    'text/csv;charset=utf-8',
  )
}
