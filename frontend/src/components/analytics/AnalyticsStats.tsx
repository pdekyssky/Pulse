/**
 * KPI stat cards for analytics overview metrics.
 */

import { Activity, AlertTriangle, Bell, Clock, Gauge } from 'lucide-react'

import { mockAlerts } from '../../data/alerts.ts'
import { mockIncidents } from '../../data/incidents.ts'
import { mockServices } from '../../data/services.ts'
import StatCard from '../dashboard/StatCard.tsx'
import { computeAnalyticsKpis } from '../../lib/analytics-stats.ts'

export default function AnalyticsStats() {
  const kpis = computeAnalyticsKpis(mockServices, mockIncidents, mockAlerts)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Overall Uptime" value={kpis.overallUptime} icon={Gauge} variant="operational" />
      <StatCard
        label="Avg Response Time"
        value={kpis.averageResponseTime}
        icon={Clock}
        variant="default"
      />
      <StatCard
        label="Total Incidents"
        value={kpis.totalIncidents}
        icon={AlertTriangle}
        variant="incidents"
      />
      <StatCard label="MTTR" value={kpis.mttr} icon={Activity} variant="degraded" />
      <StatCard label="Alert Volume" value={kpis.alertVolume} icon={Bell} variant="down" />
    </div>
  )
}
