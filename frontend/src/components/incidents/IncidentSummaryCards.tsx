/**
 * Summary stat cards for incident counts by status.
 */

import { AlertTriangle, CheckCircle2, Search, ShieldAlert } from 'lucide-react'

import type { Incident } from '../../types/incident.ts'
import StatCard from '../dashboard/StatCard.tsx'
import { computeIncidentStats } from '../../lib/incident-stats.ts'

interface IncidentSummaryCardsProps {
  incidents: Incident[]
}

export default function IncidentSummaryCards({ incidents }: IncidentSummaryCardsProps) {
  const stats = computeIncidentStats(incidents)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Active Incidents"
        value={stats.active}
        icon={AlertTriangle}
        variant="incidents"
      />
      <StatCard
        label="Investigating"
        value={stats.investigating}
        icon={Search}
        variant="default"
      />
      <StatCard
        label="Critical"
        value={stats.critical}
        icon={ShieldAlert}
        variant="down"
      />
      <StatCard
        label="Resolved"
        value={stats.resolved}
        icon={CheckCircle2}
        variant="operational"
      />
    </div>
  )
}
