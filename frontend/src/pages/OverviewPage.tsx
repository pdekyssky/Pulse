/**
 * Dashboard overview with KPIs, service status, and active incidents.
 */

import { mockServices } from '../data/services.ts'
import { mockUsers } from '../data/users.ts'
import { useIncidents } from '../hooks/useIncidents.ts'
import DashboardHeader from '../components/dashboard/DashboardHeader.tsx'
import IncidentList from '../components/dashboard/IncidentList.tsx'
import KpiCards from '../components/dashboard/KpiCards.tsx'
import ServiceStatusTable from '../components/dashboard/ServiceStatusTable.tsx'
import { getActiveIncidents } from '../lib/overview-stats.ts'

export default function OverviewPage() {
  const { incidents } = useIncidents()
  const activeIncidents = getActiveIncidents(incidents)

  return (
    <div className="space-y-6">
      <DashboardHeader />
      <KpiCards />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ServiceStatusTable services={mockServices} />
        </div>
        <div className="xl:col-span-1">
          <IncidentList incidents={activeIncidents} users={mockUsers} />
        </div>
      </div>
    </div>
  )
}
