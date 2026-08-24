/**
 * Dashboard overview with KPIs, service status, and active incidents.
 */

import QueryState from '../components/common/QueryState.tsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.tsx'
import IncidentList from '../components/dashboard/IncidentList.tsx'
import KpiCards from '../components/dashboard/KpiCards.tsx'
import ServiceStatusTable from '../components/dashboard/ServiceStatusTable.tsx'
import { useDashboardOverview, useTeamUsers } from '../hooks/useDashboardOverview.ts'
import { useServices } from '../hooks/useServices.ts'

export default function OverviewPage() {
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useDashboardOverview()
  const {
    data: services = [],
    isLoading: isServicesLoading,
    error: servicesError,
  } = useServices()
  const { data: users = [] } = useTeamUsers()

  const isLoading = isDashboardLoading || isServicesLoading
  const error = dashboardError ?? servicesError

  return (
    <QueryState isLoading={isLoading} error={error} loadingMessage="Loading dashboard...">
      <div className="space-y-6">
        <DashboardHeader />
        {dashboardData && <KpiCards stats={dashboardData.stats} />}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ServiceStatusTable services={services} />
          </div>
          <div className="xl:col-span-1">
            <IncidentList incidents={dashboardData?.activeIncidents ?? []} users={users} />
          </div>
        </div>
      </div>
    </QueryState>
  )
}
