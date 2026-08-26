/**
 * Summary stat cards for user roster composition.
 */

import { Shield, UserCheck, Users, UserCog } from 'lucide-react'

import type { User } from '../../types/user.ts'
import StatCard from '../dashboard/StatCard.tsx'
import { computeTeamStats } from '../../lib/team-stats.ts'

interface TeamStatsProps {
  members: User[]
}

export default function TeamStats({ members }: TeamStatsProps) {
  const stats = computeTeamStats(members)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total Users" value={stats.total} icon={Users} variant="default" />
      <StatCard label="Active Users" value={stats.active} icon={UserCheck} variant="operational" />
      <StatCard label="Managers" value={stats.managers} icon={UserCog} variant="default" />
      <StatCard label="Admins" value={stats.admins} icon={Shield} variant="incidents" />
    </div>
  )
}
