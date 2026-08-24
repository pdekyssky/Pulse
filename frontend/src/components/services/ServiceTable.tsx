/**
 * Table of services with view and edit actions.
 */

import { Inbox, SearchX } from 'lucide-react'

import type { Service } from '../../types/service.ts'
import Card from '../ui/Card.tsx'
import ServiceRow, { ServiceMobileCard } from './ServiceRow.tsx'

interface ServiceTableProps {
  services: Service[]
  totalCount: number
  onView: (service: Service) => void
  onEdit?: (service: Service) => void
  onDelete?: (service: Service) => void
}

export default function ServiceTable({
  services,
  totalCount,
  onView,
  onEdit,
  onDelete,
}: ServiceTableProps) {
  const hasNoServices = totalCount === 0
  const hasNoMatches = !hasNoServices && services.length === 0

  return (
    <Card>
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">
          All Services
          <span className="ml-2 text-sm font-normal text-gray-500">({services.length})</span>
        </h3>
      </div>

      {services.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 font-medium">Service</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="hidden py-3 pr-4 font-medium md:table-cell">Uptime</th>
                  <th className="hidden py-3 pr-4 font-medium sm:table-cell">Response Time</th>
                  <th className="hidden py-3 pr-4 font-medium lg:table-cell">Category</th>
                  <th className="hidden py-3 pr-4 font-medium xl:table-cell">Last Check</th>
                  <th className="px-5 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 p-4 lg:hidden">
            {services.map((service) => (
              <ServiceMobileCard
                key={service.id}
                service={service}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState hasNoServices={hasNoServices} hasNoMatches={hasNoMatches} />
      )}
    </Card>
  )
}

function EmptyState({
  hasNoServices,
  hasNoMatches,
}: {
  hasNoServices: boolean
  hasNoMatches: boolean
}) {
  if (hasNoServices) {
    return (
      <div className="flex flex-col items-center px-5 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Inbox className="size-6" aria-hidden="true" />
        </div>
        <h4 className="mt-4 text-sm font-semibold text-gray-900">No services yet</h4>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Create your first service to start monitoring infrastructure health.
        </p>
      </div>
    )
  }

  if (hasNoMatches) {
    return (
      <div className="flex flex-col items-center px-5 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <SearchX className="size-6" aria-hidden="true" />
        </div>
        <h4 className="mt-4 text-sm font-semibold text-gray-900">No matching services</h4>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Try adjusting your search or filters to find what you are looking for.
        </p>
      </div>
    )
  }

  return null
}
