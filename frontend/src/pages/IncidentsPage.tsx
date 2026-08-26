/**
 * Incident management page with list, detail panel, and admin workflow actions.
 */

import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import QueryState from '../components/common/QueryState.tsx'
import ConfirmIncidentDeleteDialog from '../components/incidents/ConfirmIncidentDeleteDialog.tsx'
import ConfirmIncidentResolveDialog from '../components/incidents/ConfirmIncidentResolveDialog.tsx'
import CreateIncidentDialog from '../components/incidents/CreateIncidentDialog.tsx'
import EditIncidentDialog from '../components/incidents/EditIncidentDialog.tsx'
import type { EditIncidentInput } from '../components/incidents/EditIncidentDialog.tsx'
import IncidentDetailPanel from '../components/incidents/IncidentDetailPanel.tsx'
import IncidentFilters from '../components/incidents/IncidentFilters.tsx'
import IncidentPagination from '../components/incidents/IncidentPagination.tsx'
import IncidentsHeader from '../components/incidents/IncidentsHeader.tsx'
import IncidentSummaryCards from '../components/incidents/IncidentSummaryCards.tsx'
import IncidentTable from '../components/incidents/IncidentTable.tsx'
import Toast from '../components/ui/Toast.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useTeamUsers } from '../hooks/useDashboardOverview.ts'
import {
  useCreateIncident,
  useCreateIncidentComment,
  useCreateIncidentEvent,
  useDeleteIncident,
  useDeleteIncidentComment,
  useIncidentDetail,
  useIncidentsList,
  useUpdateIncident,
  useUpdateIncidentComment,
} from '../hooks/useIncidentsQuery.ts'
import { useServices } from '../hooks/useServices.ts'
import { ApiError } from '../lib/api/client.ts'
import { parseIncidentNumericId } from '../lib/incident-utils.ts'
import {
  mapAssigneePatch,
  mapCreateIncidentInputToApi,
  mapEditIncidentToUpdate,
  mapIncidentCommentFormToCreateBody,
  mapIncidentCommentFormToUpdateBody,
  mapIncidentEventFormToCreateBody,
  mapResolveIncidentToUpdate,
} from '../lib/mappers/incident.ts'
import {
  defaultIncidentFilters,
  type IncidentFilters as IncidentFiltersState,
} from '../lib/incident-stats.ts'
import type { IncidentListParams } from '../types/api/incident.ts'
import type {
  CreateIncidentInput,
  Incident,
  IncidentPriority,
  IncidentStatus,
} from '../types/incident.ts'

function buildIncidentListParams(
  filters: IncidentFiltersState,
  page: number,
  pageSize: number,
): IncidentListParams {
  const params: IncidentListParams = {
    page,
    page_size: pageSize,
  }

  const search = filters.search.trim()
  if (search.length > 0) {
    params.search = search
  }
  if (filters.status !== 'all') {
    params.status = filters.status
  }
  if (filters.priority !== 'all') {
    params.severity = filters.priority
  }
  if (filters.serviceId !== 'all') {
    params.service_id = Number(filters.serviceId)
  }

  return params
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Request failed'
}

function parseRouteIncidentId(value: string | undefined): number | null {
  if (!value) {
    return null
  }

  if (!/^\d+$/.test(value)) {
    return null
  }

  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export default function IncidentsPage() {
  const { incidentId: incidentIdParam } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const currentUserId = user ? String(user.id) : null

  const [filters, setFilters] = useState<IncidentFiltersState>(defaultIncidentFilters)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(6)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [eventError, setEventError] = useState<string | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [resolvingIncident, setResolvingIncident] = useState<Incident | null>(null)
  const [deletingIncident, setDeletingIncident] = useState<Incident | null>(null)

  const selectedNumericId = parseRouteIncidentId(incidentIdParam)
  const invalidRouteId = Boolean(incidentIdParam) && selectedNumericId === null

  const listParams = useMemo(
    () => buildIncidentListParams(filters, page, pageSize),
    [filters, page, pageSize],
  )
  const {
    data: incidentData,
    isLoading: isIncidentsLoading,
    error: incidentsError,
  } = useIncidentsList(listParams)
  const { data: services = [], isLoading: isServicesLoading, error: servicesError } = useServices()
  const { data: users = [] } = useTeamUsers()

  const createIncidentMutation = useCreateIncident()
  const updateIncidentMutation = useUpdateIncident()
  const deleteIncidentMutation = useDeleteIncident()
  const createCommentMutation = useCreateIncidentComment()
  const updateCommentMutation = useUpdateIncidentComment()
  const deleteCommentMutation = useDeleteIncidentComment()
  const createEventMutation = useCreateIncidentEvent()

  const incidents = incidentData?.items ?? []

  const {
    incident: detailIncident,
    events,
    comments,
    isLoading: isDetailLoading,
    error: detailError,
  } = useIncidentDetail(selectedNumericId)

  const selectedIncident = selectedNumericId
    ? incidents.find((incident) => parseIncidentNumericId(incident.id) === selectedNumericId) ??
      detailIncident ??
      null
    : null

  const panelIncident = detailIncident ?? selectedIncident

  const isMutating =
    updateIncidentMutation.isPending ||
    deleteIncidentMutation.isPending ||
    createCommentMutation.isPending ||
    updateCommentMutation.isPending ||
    deleteCommentMutation.isPending ||
    createEventMutation.isPending

  const handleFiltersChange = (nextFilters: IncidentFiltersState) => {
    setFilters(nextFilters)
    setPage(1)
  }

  const handleSelect = (incident: Incident) => {
    const numericId = parseIncidentNumericId(incident.id)
    if (!numericId) {
      return
    }

    setActionError(null)
    setCommentError(null)
    setEventError(null)
    navigate(`/incidents/${numericId}`)
  }

  const handleCloseDetail = () => {
    setCommentError(null)
    setEventError(null)
    setIsEditOpen(false)
    navigate('/incidents')
  }

  const dismissToast = useCallback(() => {
    setToastMessage(null)
  }, [])

  const closeCreateForm = useCallback(() => {
    setIsCreateOpen(false)
    setSubmitError(null)
    createIncidentMutation.reset()
  }, [createIncidentMutation])

  const closeEditForm = useCallback(() => {
    setIsEditOpen(false)
    setEditError(null)
  }, [])

  const handleCreateSubmit = useCallback(
    async (input: CreateIncidentInput) => {
      setSubmitError(null)

      try {
        const created = await createIncidentMutation.mutateAsync(
          mapCreateIncidentInputToApi(input),
        )
        closeCreateForm()
        setToastMessage(`Incident "${created.title}" created.`)
        const numericId = parseIncidentNumericId(created.id)
        if (numericId) {
          navigate(`/incidents/${numericId}`)
        }
      } catch (mutationError) {
        setSubmitError(getErrorMessage(mutationError))
      }
    },
    [closeCreateForm, createIncidentMutation, navigate],
  )

  const requireSelectedId = () => {
    if (!selectedNumericId) {
      throw new Error('Invalid incident ID')
    }
    return selectedNumericId
  }

  const handleEditSubmit = async (input: EditIncidentInput) => {
    setEditError(null)
    try {
      await updateIncidentMutation.mutateAsync({
        id: requireSelectedId(),
        data: mapEditIncidentToUpdate(input),
      })
      closeEditForm()
      setToastMessage('Incident updated.')
    } catch (mutationError) {
      setEditError(getErrorMessage(mutationError))
    }
  }

  const handleChangeStatus = async (status: IncidentStatus) => {
    setActionError(null)
    try {
      await updateIncidentMutation.mutateAsync({
        id: requireSelectedId(),
        data: { status },
      })
      setToastMessage(`Status updated to ${status}.`)
    } catch (mutationError) {
      setActionError(getErrorMessage(mutationError))
    }
  }

  const handleChangeSeverity = async (severity: IncidentPriority) => {
    setActionError(null)
    try {
      await updateIncidentMutation.mutateAsync({
        id: requireSelectedId(),
        data: { severity },
      })
      setToastMessage(`Severity updated to ${severity}.`)
    } catch (mutationError) {
      setActionError(getErrorMessage(mutationError))
    }
  }

  const handleChangeAssignee = async (assigneeId: string | null) => {
    setActionError(null)
    const data = mapAssigneePatch(assigneeId)
    if (!data) {
      return
    }

    try {
      await updateIncidentMutation.mutateAsync({
        id: requireSelectedId(),
        data,
      })
      setToastMessage(assigneeId ? 'Assignee updated.' : 'Assignment cleared.')
    } catch (mutationError) {
      setActionError(getErrorMessage(mutationError))
    }
  }

  const handleChangeService = async (serviceId: string) => {
    setActionError(null)
    const service_id = Number.parseInt(serviceId, 10)
    if (Number.isNaN(service_id)) {
      setActionError('Invalid service ID')
      return
    }

    try {
      await updateIncidentMutation.mutateAsync({
        id: requireSelectedId(),
        data: { service_id },
      })
      setToastMessage('Service updated.')
    } catch (mutationError) {
      setActionError(getErrorMessage(mutationError))
    }
  }

  const handleResolveConfirm = async () => {
    if (!resolvingIncident) {
      return
    }

    const numericId = parseIncidentNumericId(resolvingIncident.id)
    if (!numericId) {
      setResolveError('Invalid incident ID')
      return
    }

    setResolveError(null)
    try {
      await updateIncidentMutation.mutateAsync({
        id: numericId,
        data: mapResolveIncidentToUpdate(),
      })
      setResolvingIncident(null)
      setToastMessage(`Incident "${resolvingIncident.title}" resolved.`)
    } catch (mutationError) {
      setResolveError(getErrorMessage(mutationError))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingIncident) {
      return
    }

    const numericId = parseIncidentNumericId(deletingIncident.id)
    if (!numericId) {
      setDeleteError('Invalid incident ID')
      return
    }

    setDeleteError(null)
    try {
      await deleteIncidentMutation.mutateAsync(numericId)
      setDeletingIncident(null)
      setIsEditOpen(false)
      setToastMessage(`Incident "${deletingIncident.title}" deleted.`)
      navigate('/incidents')
    } catch (mutationError) {
      setDeleteError(getErrorMessage(mutationError))
    }
  }

  const handleAddComment = async (content: string) => {
    setCommentError(null)
    try {
      await createCommentMutation.mutateAsync({
        incidentId: requireSelectedId(),
        data: mapIncidentCommentFormToCreateBody(content),
      })
      setToastMessage('Comment added.')
    } catch (mutationError) {
      const message = getErrorMessage(mutationError)
      setCommentError(message)
      throw mutationError
    }
  }

  const handleEditComment = async (commentId: string, content: string) => {
    setCommentError(null)
    const numericCommentId = Number.parseInt(commentId, 10)
    if (Number.isNaN(numericCommentId)) {
      setCommentError('Invalid comment ID')
      throw new Error('Invalid comment ID')
    }

    try {
      await updateCommentMutation.mutateAsync({
        incidentId: requireSelectedId(),
        commentId: numericCommentId,
        data: mapIncidentCommentFormToUpdateBody(content),
      })
      setToastMessage('Comment updated.')
    } catch (mutationError) {
      setCommentError(getErrorMessage(mutationError))
      throw mutationError
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    setCommentError(null)
    const numericCommentId = Number.parseInt(commentId, 10)
    if (Number.isNaN(numericCommentId)) {
      setCommentError('Invalid comment ID')
      return
    }

    try {
      await deleteCommentMutation.mutateAsync({
        incidentId: requireSelectedId(),
        commentId: numericCommentId,
      })
      setToastMessage('Comment deleted.')
    } catch (mutationError) {
      setCommentError(getErrorMessage(mutationError))
    }
  }

  const handleAddEvent = async (eventType: string, message: string) => {
    setEventError(null)
    try {
      await createEventMutation.mutateAsync({
        incidentId: requireSelectedId(),
        data: mapIncidentEventFormToCreateBody(eventType, message),
      })
      setToastMessage('Event added.')
    } catch (mutationError) {
      const errorMessage = getErrorMessage(mutationError)
      setEventError(errorMessage)
      throw mutationError
    }
  }

  const isLoading =
    (isServicesLoading && services.length === 0) ||
    (isIncidentsLoading && incidentData === undefined)
  const error = incidentsError ?? servicesError

  return (
    <QueryState isLoading={isLoading} error={error} loadingMessage="Loading incidents...">
      <div className="space-y-6">
        <IncidentsHeader onCreateClick={isAdmin ? () => setIsCreateOpen(true) : undefined} />
        {(actionError || invalidRouteId) && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {invalidRouteId ? 'Invalid incident ID.' : actionError}
          </p>
        )}
        <IncidentSummaryCards incidents={incidents} />
        <IncidentFilters filters={filters} services={services} onChange={handleFiltersChange} />
        <IncidentTable
          incidents={incidents}
          totalCount={incidentData?.total ?? incidents.length}
          services={services}
          users={users}
          onSelectIncident={handleSelect}
          onResolveIncident={
            isAdmin
              ? (incident) => {
                  setResolveError(null)
                  setResolvingIncident(incident)
                }
              : undefined
          }
        />
        <IncidentPagination
          page={incidentData?.page ?? page}
          totalPages={incidentData?.total_pages ?? 0}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() =>
            setPage((current) =>
              incidentData?.total_pages ? Math.min(incidentData.total_pages, current + 1) : current,
            )
          }
        />

        <IncidentDetailPanel
          incident={selectedNumericId ? panelIncident : null}
          events={events}
          comments={comments}
          isDetailLoading={isDetailLoading}
          detailError={detailError}
          services={services}
          users={users}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          isMutating={isMutating}
          commentError={commentError}
          eventError={eventError}
          onClose={handleCloseDetail}
          onEdit={
            isAdmin
              ? () => {
                  setEditError(null)
                  setIsEditOpen(true)
                }
              : undefined
          }
          onDelete={
            isAdmin
              ? () => {
                  if (panelIncident) {
                    setDeleteError(null)
                    setDeletingIncident(panelIncident)
                  }
                }
              : undefined
          }
          onChangeStatus={isAdmin ? handleChangeStatus : undefined}
          onChangeSeverity={isAdmin ? handleChangeSeverity : undefined}
          onChangeAssignee={isAdmin ? handleChangeAssignee : undefined}
          onChangeService={isAdmin ? handleChangeService : undefined}
          onResolve={
            isAdmin
              ? () => {
                  if (panelIncident) {
                    setResolveError(null)
                    setResolvingIncident(panelIncident)
                  }
                }
              : undefined
          }
          onAddComment={handleAddComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
          onAddEvent={handleAddEvent}
        />

        {isAdmin && (
          <CreateIncidentDialog
            key={isCreateOpen ? 'open' : 'closed'}
            open={isCreateOpen}
            services={services}
            onClose={closeCreateForm}
            onSubmit={handleCreateSubmit}
            isPending={createIncidentMutation.isPending}
            submitError={submitError}
          />
        )}

        {isAdmin && (
          <EditIncidentDialog
            incident={panelIncident}
            open={isEditOpen}
            onClose={closeEditForm}
            onSubmit={handleEditSubmit}
            isPending={updateIncidentMutation.isPending}
            submitError={editError}
          />
        )}

        {isAdmin && (
          <ConfirmIncidentResolveDialog
            incident={resolvingIncident}
            onClose={() => {
              setResolvingIncident(null)
              setResolveError(null)
            }}
            onConfirm={handleResolveConfirm}
            isPending={updateIncidentMutation.isPending}
            error={resolveError}
          />
        )}

        {isAdmin && (
          <ConfirmIncidentDeleteDialog
            incident={deletingIncident}
            onClose={() => {
              setDeletingIncident(null)
              setDeleteError(null)
            }}
            onConfirm={handleDeleteConfirm}
            isPending={deleteIncidentMutation.isPending}
            error={deleteError}
          />
        )}

        <Toast message={toastMessage} onClose={dismissToast} />
      </div>
    </QueryState>
  )
}
