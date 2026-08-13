/**
 * Summary stat cards for alert counts by severity.
 */

import { AlertTriangle, Bell, CheckCircle2, ShieldAlert } from 'lucide-react'

import type { Alert } from '../../types/alert.ts'
import StatCard from '../dashboard/StatCard.tsx'
import { computeAlertStats } from '../../lib/alert-stats.ts'

interface AlertStatsProps {
  alerts: Alert[]
}

export default function AlertStats({ alerts }: AlertStatsProps) {
  const stats = computeAlertStats(alerts)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Active Alerts" value={stats.active} icon={Bell} variant="incidents" />
      <StatCard label="Critical" value={stats.critical} icon={ShieldAlert} variant="down" />
      <StatCard
        label="Acknowledged"
        value={stats.acknowledged}
        icon={AlertTriangle}
        variant="default"
      />
      <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} variant="operational" />
    </div>
  )
}
