/**
 * Summary stat cards for timeline event counts.
 */

import { AlertTriangle, Bell, Calendar, Rocket } from 'lucide-react'

import type { TimelineStats as TimelineStatsData } from '../../lib/timeline-stats.ts'
import StatCard from '../dashboard/StatCard.tsx'

interface TimelineStatsProps {
  stats: TimelineStatsData
}

export default function TimelineStats({ stats }: TimelineStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Events Today" value={stats.eventsToday} icon={Calendar} variant="default" />
      <StatCard label="Incidents" value={stats.incidents} icon={AlertTriangle} variant="incidents" />
      <StatCard label="Alerts" value={stats.alerts} icon={Bell} variant="down" />
      <StatCard label="Service Events" value={stats.serviceEvents} icon={Rocket} variant="operational" />
    </div>
  )
}
