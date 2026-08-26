/**
 * KPI stat cards for incident report totals.
 */

import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react'

import type { IncidentReportStats } from '../../lib/report-stats.ts'
import StatCard from '../dashboard/StatCard.tsx'

interface ReportStatsProps {
  stats: IncidentReportStats
}

export default function ReportStats({ stats }: ReportStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Incidents" value={stats.total} icon={FileText} variant="default" />
      <StatCard label="Open" value={stats.open} icon={AlertTriangle} variant="incidents" />
      <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} variant="operational" />
    </div>
  )
}
