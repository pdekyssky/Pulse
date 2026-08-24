/**
 * KPI stat cards for report summary metrics.
 */

import { CalendarClock, FileText, Layers, Server } from 'lucide-react'

import type { ReportStatsSummary } from '../../lib/report-stats.ts'
import StatCard from '../dashboard/StatCard.tsx'

interface ReportStatsProps {
  stats: ReportStatsSummary
}

export default function ReportStats({ stats }: ReportStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Reports Generated" value={stats.total} icon={FileText} variant="default" />
      <StatCard
        label="Incident Reports"
        value={stats.incidentReports}
        icon={Layers}
        variant="incidents"
      />
      <StatCard
        label="Service Reports"
        value={stats.serviceReports}
        icon={Server}
        variant="operational"
      />
      <StatCard
        label="Scheduled Reports"
        value={stats.scheduled}
        icon={CalendarClock}
        variant="degraded"
      />
    </div>
  )
}
