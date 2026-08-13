/**
 * Table of alerts with service and severity columns.
 */

import type { Alert } from '../../types/alert.ts'
import type { Service } from '../../types/service.ts'
import Card from '../ui/Card.tsx'
import AlertRow, { AlertMobileCard } from './AlertRow.tsx'

interface AlertTableProps {
  alerts: Alert[]
  services: Service[]
}

export default function AlertTable({ alerts, services }: AlertTableProps) {
  const getServiceById = (id: string) => services.find((service) => service.id === id)

  return (
    <Card>
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">
          All Alerts
          <span className="ml-2 text-sm font-normal text-gray-500">({alerts.length})</span>
        </h3>
      </div>

      {alerts.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 font-medium">Alert</th>
                  <th className="hidden py-3 pr-4 font-medium lg:table-cell">Message</th>
                  <th className="py-3 pr-4 font-medium">Severity</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="hidden py-3 pr-4 font-medium md:table-cell">Service</th>
                  <th className="hidden py-3 pr-4 font-medium sm:table-cell">Created</th>
                  <th className="px-5 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    service={getServiceById(alert.serviceId)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 p-4 md:hidden">
            {alerts.map((alert) => (
              <AlertMobileCard
                key={alert.id}
                alert={alert}
                service={getServiceById(alert.serviceId)}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="px-5 py-12 text-center text-sm text-gray-500">
          No alerts match your filters.
        </p>
      )}
    </Card>
  )
}
