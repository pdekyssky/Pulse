import { keepPreviousData, useQuery } from '@tanstack/react-query'

import {
  fetchIncident,
  fetchIncidentComments,
  fetchIncidentEvents,
  fetchIncidents,
} from '../lib/api/incidents.ts'
import { queryKeys } from '../lib/api/query-keys.ts'
import {
  mapApiCommentToIncidentComment,
  mapApiEventToIncidentEvent,
  mapApiIncidentToIncident,
} from '../lib/mappers/incident.ts'
import type { IncidentListParams } from '../types/api/incident.ts'
import type { Incident, IncidentComment, IncidentEvent } from '../types/incident.ts'

export interface PaginatedIncidentList {
  items: Incident[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export function useIncidentsList(params: IncidentListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.incidents, params],
    placeholderData: keepPreviousData,
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
