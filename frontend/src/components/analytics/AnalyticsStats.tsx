/**
 * KPI stat cards for analytics incident and resolution metrics.
 */

import { AlertTriangle, CheckCircle2, Clock, Search } from 'lucide-react'

import type { AnalyticsOverview } from '../../types/analytics.ts'
import { formatDurationFromSeconds } from '../../lib/format.ts'
import StatCard from '../dashboard/StatCard.tsx'

interface AnalyticsStatsProps {
  overview: AnalyticsOverview
}

export default function AnalyticsStats({ overview }: AnalyticsStatsProps) {
  const resolutionLabel = formatDurationFromSeconds(overview.averageResolutionSeconds)
  const resolutionSubtext =
    overview.resolvedSampleSize > 0
      ? `Based on ${overview.resolvedSampleSize} resolved incident${overview.resolvedSampleSize === 1 ? '' : 's'}`
      : 'No resolved incidents in this period'

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Incidents"
        value={overview.incidents.total}
        icon={AlertTriangle}
        variant="incidents"
      />
      <StatCard
        label="Open"
        value={overview.incidents.open}
        icon={Search}
        variant="degraded"
      />
      <StatCard
        label="Resolved"
        value={overview.incidents.resolved}
        icon={CheckCircle2}
        variant="operational"
      />
      <StatCard
        label="Avg Resolution Time"
        value={resolutionLabel}
        subtext={resolutionSubtext}
        icon={Clock}
        variant="default"
      />
    </div>
  )
}
