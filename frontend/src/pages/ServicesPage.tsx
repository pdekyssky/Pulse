/**
 * Service registry with local mock CRUD, filters, and detail views.
 */

import { useMemo, useState } from 'react'

import { mockServices } from '../data/services.ts'
import { mockUsers } from '../data/users.ts'
import ServiceDetails from '../components/services/ServiceDetails.tsx'
import ServiceFilters from '../components/services/ServiceFilters.tsx'
import ServiceFormDialog from '../components/services/ServiceForm.tsx'
import ServicesHeader from '../components/services/ServicesHeader.tsx'
import ServiceStats from '../components/services/ServiceStats.tsx'
import ServiceTable from '../components/services/ServiceTable.tsx'
import {
  createServiceFromInput,
  serviceToFormInput,
  updateServiceFromInput,
} from '../lib/service-utils.ts'
import {
  defaultServiceFilters,
  filterServices,
  type ServiceFilters as ServiceFiltersState,
} from '../lib/service-stats.ts'
import type { Service, ServiceFormInput } from '../types/service.ts'

type FormMode = 'create' | 'edit' | null

export default function ServicesPage() {
  // Clone mock data so edits stay local to this page session
  const [services, setServices] = useState<Service[]>(() => [...mockServices])
  const [filters, setFilters] = useState<ServiceFiltersState>(defaultServiceFilters)
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [viewingServiceId, setViewingServiceId] = useState<string | null>(null)

  const filteredServices = useMemo(
    () => filterServices(services, filters),
    [services, filters],
  )

  const viewingService = useMemo(
    () => services.find((service) => service.id === viewingServiceId) ?? null,
    [services, viewingServiceId],
  )

  const viewingOwner = mockUsers.find((user) => user.id === viewingService?.ownerId)

  const handleCreateClick = () => {
    setEditingService(null)
    setFormMode('create')
  }

  const handleView = (service: Service) => {
    setViewingServiceId(service.id)
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormMode('edit')
  }

  const handleFormClose = () => {
    setFormMode(null)
    setEditingService(null)
  }

  const handleFormSubmit = (input: ServiceFormInput) => {
    if (formMode === 'create') {
      setServices((current) => [...current, createServiceFromInput(input, current)])
      return
    }

    if (formMode === 'edit' && editingService) {
      setServices((current) =>
        current.map((service) =>
          service.id === editingService.id
            ? updateServiceFromInput(service, input)
            : service,
        ),
      )
    }
  }

  return (
    <div className="space-y-6">
      <ServicesHeader onCreateClick={handleCreateClick} />
      <ServiceStats services={services} />
      <ServiceFilters filters={filters} onChange={setFilters} />
      <ServiceTable
        services={filteredServices}
        totalCount={services.length}
        onView={handleView}
        onEdit={handleEdit}
      />

      <ServiceDetails
        service={viewingService}
        owner={viewingOwner}
        onClose={() => setViewingServiceId(null)}
      />

      <ServiceFormDialog
        // Remount form when switching between create and edit modes
        key={formMode === 'edit' && editingService ? editingService.id : 'create'}
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        users={mockUsers}
        initialValues={editingService ? serviceToFormInput(editingService) : undefined}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
