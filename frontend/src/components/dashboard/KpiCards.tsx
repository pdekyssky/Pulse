/**
 * Grid of KPI stat cards for the overview dashboard.
 */

import {
  AlertTriangle,
  CheckCircle2,
  Layers,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

import type { DashboardOverviewStats } from '../../types/api/dashboard.ts'
import StatCard from './StatCard.tsx'

interface KpiCardsProps {
  stats: DashboardOverviewStats
}

export default function KpiCards({ stats }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total Services" value={stats.totalServices} icon={Layers} variant="default" />
      <StatCard
        label="Operational"
        value={stats.operational}
        subtext={`${stats.operationalPercent}%`}
        icon={CheckCircle2}
        variant="operational"
      />
      <StatCard
        label="Degraded"
        value={stats.degraded}
        subtext={`${stats.degradedPercent}%`}
        icon={TrendingUp}
        variant="degraded"
      />
      <StatCard
        label="Down"
        value={stats.down}
        subtext={`${stats.downPercent}%`}
        icon={TrendingDown}
        variant="down"
      />
      <StatCard
        label="Active Incidents"
        value={stats.activeIncidents}
        subtext="View all"
        subtextHref="/incidents"
        icon={AlertTriangle}
        variant="incidents"
      />
    </div>
  )
}
