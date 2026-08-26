/**
 * Service registry with API-backed list, filters, detail views, and admin CRUD.
 */

import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import DeleteServiceDialog from '../components/services/DeleteServiceDialog.tsx'
import QueryState from '../components/common/QueryState.tsx'
import ServiceDetails from '../components/services/ServiceDetails.tsx'
import ServiceFilters from '../components/services/ServiceFilters.tsx'
import ServiceFormDialog from '../components/services/ServiceForm.tsx'
import ServicesHeader from '../components/services/ServicesHeader.tsx'
import ServiceStats from '../components/services/ServiceStats.tsx'
import ServiceTable from '../components/services/ServiceTable.tsx'
import IncidentPagination from '../components/incidents/IncidentPagination.tsx'
import Toast from '../components/ui/Toast.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useTeamUsers } from '../hooks/useDashboardOverview.ts'
import {
  useCreateService,
  useDeleteService,
  useServices,
  useUpdateService,
} from '../hooks/useServices.ts'
import { ApiError } from '../lib/api/client.ts'
import {
  DEFAULT_PAGE_SIZE,
  getTotalPages,
  paginateItems,
} from '../lib/pagination.ts'
import {
  mapServiceFormToCreateBody,
  mapServiceFormToUpdateBody,
  serviceToUpdateFormInput,
  toServiceCreateFormInput,
  toServiceUpdateFormInput,
} from '../lib/mappers/service.ts'
import { parseServiceNumericId, serviceToFormInput } from '../lib/service-utils.ts'
import {
  defaultServiceFilters,
  filterServices,
  type ServiceFilters as ServiceFiltersState,
} from '../lib/service-stats.ts'
import type { ServiceFormInput } from '../types/service.ts'
import type { Service } from '../types/service.ts'

type ServiceFormState =
  | { mode: 'create' }
  | { mode: 'edit'; service: Service }

function parseServiceId(id: string): number {
  const serviceId = Number.parseInt(id, 10)
  if (Number.isNaN(serviceId)) {
    throw new Error('Invalid service ID')
  }
  return serviceId
}

function parseRouteServiceId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null
  }

  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export default function ServicesPage() {
  const { serviceId: serviceIdParam } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const { data: services = [], isLoading, error } = useServices()
  const { data: users = [] } = useTeamUsers()
  const createServiceMutation = useCreateService()
  const updateServiceMutation = useUpdateService()
  const deleteServiceMutation = useDeleteService()

  const [filters, setFilters] = useState<ServiceFiltersState>(defaultServiceFilters)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)
  const [formState, setFormState] = useState<ServiceFormState | null>(null)
  const [deletingService, setDeletingService] = useState<Service | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const selectedNumericId = parseRouteServiceId(serviceIdParam)

  const filteredServices = useMemo(
    () => filterServices(services, filters),
    [services, filters],
  )

  const totalPages = getTotalPages(filteredServices.length, pageSize)
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const paginatedServices = useMemo(
    () => paginateItems(filteredServices, currentPage, pageSize),
    [filteredServices, currentPage, pageSize],
  )

  const viewingService = useMemo(
    () =>
      selectedNumericId
        ? services.find((service) => parseServiceNumericId(service.id) === selectedNumericId) ??
          null
        : null,
    [selectedNumericId, services],
  )

  const viewingOwner = users.find((user) => user.id === viewingService?.ownerId)

  const isFormPending =
    formState?.mode === 'create'
      ? createServiceMutation.isPending
      : updateServiceMutation.isPending

  const handleView = (service: Service) => {
    const numericId = parseServiceNumericId(service.id)
    if (!numericId) {
      return
    }
    navigate(`/services/${numericId}`)
  }

  const handleFiltersChange = (nextFilters: ServiceFiltersState) => {
    setFilters(nextFilters)
    setPage(1)
  }

  const openCreateForm = useCallback(() => {
    setSubmitError(null)
    setFormState({ mode: 'create' })
  }, [])

  const openEditForm = useCallback((service: Service) => {
    setSubmitError(null)
    setFormState({ mode: 'edit', service })
  }, [])

  const openDeleteDialog = useCallback((service: Service) => {
    setDeleteError(null)
    setDeletingService(service)
  }, [])

  const closeDeleteDialog = useCallback(() => {
    setDeletingService(null)
    setDeleteError(null)
    deleteServiceMutation.reset()
  }, [deleteServiceMutation])

  const closeForm = useCallback(() => {
    setFormState(null)
    setSubmitError(null)
    createServiceMutation.reset()
    updateServiceMutation.reset()
  }, [createServiceMutation, updateServiceMutation])

  const dismissToast = useCallback(() => {
    setToastMessage(null)
  }, [])

  const handleFormSubmit = useCallback(
    async (input: ServiceFormInput) => {
      setSubmitError(null)

      try {
        if (formState?.mode === 'create') {
          const body = mapServiceFormToCreateBody(toServiceCreateFormInput(input))
          const created = await createServiceMutation.mutateAsync(body)
          setToastMessage('Service created successfully.')
          const numericId = parseServiceNumericId(created.id)
          if (numericId) {
            navigate(`/services/${numericId}`)
          }
        } else if (formState?.mode === 'edit') {
          const original = serviceToUpdateFormInput(formState.service)
          const updateInput = toServiceUpdateFormInput(input)
          const body = mapServiceFormToUpdateBody(updateInput, original)

          await updateServiceMutation.mutateAsync({
            id: parseServiceId(formState.service.id),
            data: body,
          })
          setToastMessage('Service updated successfully.')
        } else {
          return
        }

        closeForm()
      } catch (mutationError) {
        const message =
          mutationError instanceof ApiError
            ? mutationError.message
            : mutationError instanceof Error
              ? mutationError.message
              : 'Request failed'

        setSubmitError(message)
      }
    },
    [closeForm, createServiceMutation, formState, navigate, updateServiceMutation],
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingService) {
      return
    }

    setDeleteError(null)

    try {
      await deleteServiceMutation.mutateAsync(parseServiceId(deletingService.id))

      if (selectedNumericId === parseServiceNumericId(deletingService.id)) {
        navigate('/services')
      }

      closeDeleteDialog()
      setToastMessage('Service deleted successfully.')
    } catch (mutationError) {
      const message =
        mutationError instanceof ApiError
          ? mutationError.message
          : mutationError instanceof Error
            ? mutationError.message
            : 'Request failed'

      setDeleteError(message)
    }
  }, [closeDeleteDialog, deleteServiceMutation, deletingService, navigate, selectedNumericId])

  const formInitialValues =
    formState?.mode === 'edit' ? serviceToFormInput(formState.service) : undefined

  return (
    <QueryState isLoading={isLoading} error={error} loadingMessage="Loading services...">
      <div className="space-y-6">
        <ServicesHeader onCreateClick={isAdmin ? openCreateForm : undefined} />
        <ServiceStats services={services} />
        <ServiceFilters filters={filters} onChange={handleFiltersChange} />
        <ServiceTable
          services={paginatedServices}
          users={users}
          totalCount={services.length}
          onView={handleView}
          onEdit={isAdmin ? openEditForm : undefined}
          onDelete={isAdmin ? openDeleteDialog : undefined}
        />
        <IncidentPagination
          page={currentPage}
          totalPages={totalPages}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
        />

        <ServiceDetails
          service={viewingService}
          owner={viewingOwner}
          onClose={() => navigate('/services')}
        />

        {isAdmin && formState && (
          <ServiceFormDialog
            open
            mode={formState.mode}
            users={users}
            initialValues={formInitialValues}
            onClose={closeForm}
            onSubmit={handleFormSubmit}
            isPending={isFormPending}
            submitError={submitError}
          />
        )}

        {isAdmin && (
          <DeleteServiceDialog
            service={deletingService}
            onClose={closeDeleteDialog}
            onConfirm={handleDeleteConfirm}
            isPending={deleteServiceMutation.isPending}
            error={deleteError}
          />
        )}

        <Toast message={toastMessage} onClose={dismissToast} />
      </div>
    </QueryState>
  )
}
