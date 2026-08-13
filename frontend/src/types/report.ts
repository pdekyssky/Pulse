/**
 * TypeScript types for generated reports and form inputs.
 */

export type ReportType =
  | 'incident_summary'
  | 'service_availability'
  | 'performance'
  | 'alert_summary'
  | 'monthly_operations'

export type ReportStatus = 'completed' | 'generating' | 'scheduled' | 'failed'

export interface ReportMetric {
  label: string
  value: string
}

export interface Report {
  id: string
  name: string
  type: ReportType
  periodStart: string
  periodEnd: string
  createdAt: string
  status: ReportStatus
  generatedById: string
  description?: string
  summary: string
  scope: string
  serviceIds?: string[]
  metrics: ReportMetric[]
  scheduledFor?: string
}

export const reportTypeLabels: Record<ReportType, string> = {
  incident_summary: 'Incident Summary',
  service_availability: 'Service Availability',
  performance: 'Performance Report',
  alert_summary: 'Alert Summary',
  monthly_operations: 'Monthly Operations Report',
}

export const reportStatusLabels: Record<ReportStatus, string> = {
  completed: 'Completed',
  generating: 'Generating',
  scheduled: 'Scheduled',
  failed: 'Failed',
}

export interface ReportFormInput {
  name: string
  type: ReportType
  periodStart: string
  periodEnd: string
  scope: string
  description?: string
}
