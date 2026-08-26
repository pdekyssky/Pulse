/**
 * Incident report filter state.
 */

import type { IncidentPriority, IncidentStatus } from '../types/incident.ts'

export interface IncidentReportStats {
  total: number
  open: number
  resolved: number
}

export type ReportFilterPeriod = 'all' | 'last_7_days' | 'last_30_days' | 'last_90_days'

export interface IncidentReportFilters {
  search: string
  severity: IncidentPriority | 'all'
  status: IncidentStatus | 'all'
  serviceId: string
  period: ReportFilterPeriod
}

export const defaultIncidentReportFilters: IncidentReportFilters = {
  search: '',
  severity: 'all',
  status: 'all',
  serviceId: 'all',
  period: 'all',
}
