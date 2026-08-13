/**
 * Timeline event filtering, sorting, and summary stats.
 */

import type { TimelineEvent, TimelineEventType } from '../types/timeline.ts'
import { timelineEventCategories } from '../types/timeline.ts'

export interface TimelineStats {
  eventsToday: number
  incidents: number
  alerts: number
  serviceEvents: number
}

export function computeTimelineStats(events: TimelineEvent[]): TimelineStats {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const isIncidentType = (type: TimelineEventType) =>
    (timelineEventCategories.incident as readonly string[]).includes(type)

  const isAlertType = (type: TimelineEventType) =>
    (timelineEventCategories.alert as readonly string[]).includes(type)

  const isServiceEventType = (type: TimelineEventType) =>
    (timelineEventCategories.service as readonly string[]).includes(type)

  return {
    eventsToday: events.filter(
      (event) => new Date(event.timestamp).getTime() >= todayStart.getTime(),
    ).length,
    incidents: events.filter((event) => isIncidentType(event.type)).length,
    alerts: events.filter((event) => isAlertType(event.type)).length,
    serviceEvents: events.filter((event) => isServiceEventType(event.type)).length,
  }
}

export type TimelineFilterType = TimelineEventType | 'all'

export type TimelinePeriodFilter = 'all' | 'today' | '7d' | '30d'

export interface TimelineFilters {
  search: string
  type: TimelineFilterType
  serviceId: string
  period: TimelinePeriodFilter
}

export const defaultTimelineFilters: TimelineFilters = {
  search: '',
  type: 'all',
  serviceId: 'all',
  period: 'all',
}

export function filterTimelineEvents(
  events: TimelineEvent[],
  filters: TimelineFilters,
): TimelineEvent[] {
  const search = filters.search.trim().toLowerCase()
  const now = Date.now()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const periodCutoff: Record<TimelinePeriodFilter, number | null> = {
    all: null,
    today: todayStart.getTime(),
    '7d': now - 7 * 24 * 60 * 60 * 1000,
    '30d': now - 30 * 24 * 60 * 60 * 1000,
  }

  const cutoff = periodCutoff[filters.period]

  return events.filter((event) => {
    const matchesSearch =
      search.length === 0 ||
      event.title.toLowerCase().includes(search) ||
      event.description.toLowerCase().includes(search)

    const matchesType = filters.type === 'all' || event.type === filters.type
    const matchesService =
      filters.serviceId === 'all' ||
      event.serviceId === filters.serviceId

    const matchesPeriod =
      cutoff === null || new Date(event.timestamp).getTime() >= cutoff

    return matchesSearch && matchesType && matchesService && matchesPeriod
  })
}

export function sortTimelineEvents(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

export function groupTimelineEventsByDate(
  events: TimelineEvent[],
): Array<{ date: string; label: string; events: TimelineEvent[] }> {
  const groups = new Map<string, TimelineEvent[]>()

  for (const event of events) {
    const date = event.timestamp.slice(0, 10)
    const existing = groups.get(date) ?? []
    existing.push(event)
    groups.set(date, existing)
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // Newest dates first
    .map(([date, groupedEvents]) => ({
      date,
      label: formatDateLabel(date),
      events: groupedEvents,
    }))
}

function formatDateLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
