/**
 * Summary stat cards for service health distribution.
 */

import { CheckCircle2, Layers, TrendingDown, TrendingUp } from 'lucide-react'

import type { Service } from '../../types/service.ts'
import StatCard from '../dashboard/StatCard.tsx'
import { computeServiceStats } from '../../lib/service-stats.ts'

interface ServiceStatsProps {
  services: Service[]
}

export default function ServiceStats({ services }: ServiceStatsProps) {
  const stats = computeServiceStats(services)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
    </div>
  )
}
