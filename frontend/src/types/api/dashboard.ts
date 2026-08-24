export interface ApiIncidentTotals {
  total: number
  active: number
  resolved: number
}

export interface ApiServiceTotals {
  total: number
}

export interface ApiAlertTotals {
  total: number
  active: number
  resolved: number
}

export interface ApiIncidentResponse {
  id: number
  title: string
  description: string | null
  status: string
  severity: string
  service_id: number
  created_by_id: number
  assigned_to_id: number | null
  started_at: string
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface ApiDashboardOverview {
  incidents: ApiIncidentTotals
  incidents_by_severity: Record<string, number>
  incidents_by_status: Record<string, number>
  services: ApiServiceTotals
  services_by_status: Record<string, number>
  alerts: ApiAlertTotals
  alerts_by_status: Record<string, number>
  recent_incidents: ApiIncidentResponse[]
}

export interface DashboardOverviewStats {
  totalServices: number
  operational: number
  degraded: number
  down: number
  activeIncidents: number
  operationalPercent: number
  degradedPercent: number
  downPercent: number
}
