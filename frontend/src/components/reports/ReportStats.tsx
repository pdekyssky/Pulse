/**
 * Summary stat cards for report counts by status.
 */

import { CalendarClock, FileBarChart, FileText, Server } from 'lucide-react'

import type { Report } from '../../types/report.ts'
import StatCard from '../dashboard/StatCard.tsx'
import { computeReportStats } from '../../lib/report-stats.ts'

interface ReportStatsProps {
  reports: Report[]
}

export default function ReportStats({ reports }: ReportStatsProps) {
  const stats = computeReportStats(reports)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Reports Generated" value={stats.total} icon={FileText} variant="default" />
      <StatCard
        label="Incident Reports"
        value={stats.incidentReports}
        icon={FileBarChart}
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
        variant="default"
      />
    </div>
  )
}
