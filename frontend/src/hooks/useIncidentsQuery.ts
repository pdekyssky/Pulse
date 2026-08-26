import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createIncident,
  createIncidentComment,
  createIncidentEvent,
  deleteIncident,
  deleteIncidentComment,
  fetchIncident,
  fetchIncidentComments,
  fetchIncidentEvents,
  fetchIncidents,
  updateIncident,
  updateIncidentComment,
} from '../lib/api/incidents.ts'
import { queryKeys } from '../lib/api/query-keys.ts'
import { parseIncidentNumericId } from '../lib/incident-utils.ts'
import {
  mapApiCommentToIncidentComment,
  mapApiEventToIncidentEvent,
  mapApiIncidentToIncident,
} from '../lib/mappers/incident.ts'
import type {
  ApiIncidentCommentCreate,
  ApiIncidentCommentUpdate,
  ApiIncidentCreate,
  ApiIncidentEventCreate,
  ApiIncidentUpdate,
  IncidentListParams,
} from '../types/api/incident.ts'
import type { Incident, IncidentComment, IncidentEvent } from '../types/incident.ts'

export interface PaginatedIncidentList {
  items: Incident[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

function invalidateIncidentData(queryClient: ReturnType<typeof useQueryClient>, incidentId?: number) {
  queryClient.invalidateQueries({ queryKey: queryKeys.incidents })
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboardOverview })
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications })

  if (typeof incidentId === 'number') {
    queryClient.invalidateQueries({ queryKey: queryKeys.incident(incidentId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.incidentEvents(incidentId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.incidentComments(incidentId) })
  }
}

export function useIncidentsList(params: IncidentListParams = {}, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.incidents, params],
    placeholderData: keepPreviousData,
    enabled,
    queryFn: async (): Promise<PaginatedIncidentList> => {
      const response = await fetchIncidents(params)

      return {
        items: response.items.map(mapApiIncidentToIncident),
        page: response.page,
        page_size: response.page_size,
        total: response.total,
        total_pages: response.total_pages,
      }
    },
  })
}

export interface IncidentDetailData {
  incident: Incident
  events: IncidentEvent[]
  comments: IncidentComment[]
}

export function useIncidentDetail(id: number | null | undefined) {
  const enabled = typeof id === 'number' && id > 0
  const incidentId = enabled ? id : 0

  const incidentQuery = useQuery({
    queryKey: queryKeys.incident(incidentId),
    queryFn: async () => mapApiIncidentToIncident(await fetchIncident(incidentId)),
    enabled,
  })

  const eventsQuery = useQuery({
    queryKey: queryKeys.incidentEvents(incidentId),
    queryFn: async () => {
      const events = await fetchIncidentEvents(incidentId)
      return events.map(mapApiEventToIncidentEvent)
    },
    enabled,
  })

  const commentsQuery = useQuery({
    queryKey: queryKeys.incidentComments(incidentId),
    queryFn: async () => {
      const comments = await fetchIncidentComments(incidentId)
      return comments.map(mapApiCommentToIncidentComment)
    },
    enabled,
  })

  const data: IncidentDetailData | undefined =
    incidentQuery.data !== undefined
      ? {
          incident: incidentQuery.data,
          events: eventsQuery.data ?? [],
          comments: commentsQuery.data ?? [],
        }
      : undefined

  return {
    data,
    incident: incidentQuery.data,
    events: eventsQuery.data ?? [],
    comments: commentsQuery.data ?? [],
    isLoading: incidentQuery.isLoading || eventsQuery.isLoading || commentsQuery.isLoading,
    isFetching:
      incidentQuery.isFetching || eventsQuery.isFetching || commentsQuery.isFetching,
    error: incidentQuery.error ?? eventsQuery.error ?? commentsQuery.error,
    incidentQuery,
    eventsQuery,
    commentsQuery,
  }
}

export function useCreateIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ApiIncidentCreate): Promise<Incident> => {
      const incident = await createIncident(data)
      return mapApiIncidentToIncident(incident)
    },
    onSuccess: (incident) => {
      invalidateIncidentData(queryClient, parseIncidentNumericId(incident.id) ?? undefined)
    },
  })
}

export interface UpdateIncidentVariables {
  id: number
  data: ApiIncidentUpdate
}

export function useUpdateIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: UpdateIncidentVariables): Promise<Incident> => {
      const incident = await updateIncident(id, data)
      return mapApiIncidentToIncident(incident)
    },
    onSuccess: (_incident, variables) => {
      invalidateIncidentData(queryClient, variables.id)
    },
  })
}

export function useDeleteIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteIncident(id),
    onSuccess: (_result, id) => {
      invalidateIncidentData(queryClient, id)
    },
  })
}

export interface CreateIncidentCommentVariables {
  incidentId: number
  data: ApiIncidentCommentCreate
}

export function useCreateIncidentComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ incidentId, data }: CreateIncidentCommentVariables) => {
      const comment = await createIncidentComment(incidentId, data)
      return mapApiCommentToIncidentComment(comment)
    },
    onSuccess: (_comment, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidentComments(variables.incidentId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}

export interface UpdateIncidentCommentVariables {
  incidentId: number
  commentId: number
  data: ApiIncidentCommentUpdate
}

export function useUpdateIncidentComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ incidentId, commentId, data }: UpdateIncidentCommentVariables) => {
      const comment = await updateIncidentComment(incidentId, commentId, data)
      return mapApiCommentToIncidentComment(comment)
    },
    onSuccess: (_comment, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidentComments(variables.incidentId) })
    },
  })
}

export interface DeleteIncidentCommentVariables {
  incidentId: number
  commentId: number
}

export function useDeleteIncidentComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ incidentId, commentId }: DeleteIncidentCommentVariables) =>
      deleteIncidentComment(incidentId, commentId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidentComments(variables.incidentId) })
    },
  })
}

export interface CreateIncidentEventVariables {
  incidentId: number
  data: ApiIncidentEventCreate
}

export function useCreateIncidentEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ incidentId, data }: CreateIncidentEventVariables) => {
      const event = await createIncidentEvent(incidentId, data)
      return mapApiEventToIncidentEvent(event)
    },
    onSuccess: (_event, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidentEvents(variables.incidentId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}
