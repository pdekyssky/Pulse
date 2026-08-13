/**
 * Mock time-series data for analytics charts.
 */

import type {
  IncidentTrendDataPoint,
  ResponseTimeDataPoint,
  ServiceUptimeSeries,
  UptimeDataPoint,
} from '../types/analytics.ts'

const day = (offset: number) => {
  const date = new Date('2026-08-12T12:00:00Z')
  date.setUTCDate(date.getUTCDate() - offset)
  const iso = date.toISOString().slice(0, 10)
  const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { date: iso, label }
}

function buildUptimeSeries(
  offsets: Array<{ offset: number; uptime: number }>,
): UptimeDataPoint[] {
  return offsets.map(({ offset, uptime }) => {
    const { date, label } = day(offset)
    return { date, label, uptime }
  })
}

export const overallUptimeSeries: UptimeDataPoint[] = buildUptimeSeries([
  { offset: 29, uptime: 99.72 },
  { offset: 28, uptime: 99.75 },
  { offset: 27, uptime: 99.78 },
  { offset: 26, uptime: 99.74 },
  { offset: 25, uptime: 99.8 },
  { offset: 24, uptime: 99.82 },
  { offset: 23, uptime: 99.79 },
  { offset: 22, uptime: 99.81 },
  { offset: 21, uptime: 99.77 },
  { offset: 20, uptime: 99.83 },
  { offset: 19, uptime: 99.85 },
  { offset: 18, uptime: 99.84 },
  { offset: 17, uptime: 99.86 },
  { offset: 16, uptime: 99.82 },
  { offset: 15, uptime: 99.88 },
  { offset: 14, uptime: 99.87 },
  { offset: 13, uptime: 99.89 },
  { offset: 12, uptime: 99.9 },
  { offset: 11, uptime: 99.88 },
  { offset: 10, uptime: 99.91 },
  { offset: 9, uptime: 99.89 },
  { offset: 8, uptime: 99.92 },
  { offset: 7, uptime: 99.9 },
  { offset: 6, uptime: 99.93 },
  { offset: 5, uptime: 99.91 },
  { offset: 4, uptime: 99.94 },
  { offset: 3, uptime: 99.92 },
  { offset: 2, uptime: 99.95 },
  { offset: 1, uptime: 99.93 },
  { offset: 0, uptime: 98.84 },
])

export const serviceUptimeSeries: ServiceUptimeSeries[] = [
  {
    serviceId: 'svc-api-gateway',
    data: buildUptimeSeries([
      { offset: 6, uptime: 99.97 }, { offset: 5, uptime: 99.98 }, { offset: 4, uptime: 99.98 },
      { offset: 3, uptime: 99.97 }, { offset: 2, uptime: 99.98 }, { offset: 1, uptime: 99.98 },
      { offset: 0, uptime: 99.98 },
    ]),
  },
  {
    serviceId: 'svc-payment',
    data: buildUptimeSeries([
      { offset: 6, uptime: 99.85 }, { offset: 5, uptime: 99.8 }, { offset: 4, uptime: 99.78 },
      { offset: 3, uptime: 99.75 }, { offset: 2, uptime: 99.7 }, { offset: 1, uptime: 99.1 },
      { offset: 0, uptime: 98.72 },
    ]),
  },
  {
    serviceId: 'svc-database',
    data: buildUptimeSeries([
      { offset: 6, uptime: 99.99 }, { offset: 5, uptime: 99.99 }, { offset: 4, uptime: 99.98 },
      { offset: 3, uptime: 99.97 }, { offset: 2, uptime: 99.95 }, { offset: 1, uptime: 99.2 },
      { offset: 0, uptime: 94.1 },
    ]),
  },
  {
    serviceId: 'svc-background-worker',
    data: buildUptimeSeries([
      { offset: 6, uptime: 99.1 }, { offset: 5, uptime: 98.8 }, { offset: 4, uptime: 98.5 },
      { offset: 3, uptime: 98.2 }, { offset: 2, uptime: 97.9 }, { offset: 1, uptime: 97.6 },
      { offset: 0, uptime: 97.45 },
    ]),
  },
]

export const incidentTrendSeries: IncidentTrendDataPoint[] = [
  { ...day(29), total: 0, critical: 0, resolved: 0 },
  { ...day(28), total: 1, critical: 0, resolved: 1 },
  { ...day(27), total: 0, critical: 0, resolved: 0 },
  { ...day(26), total: 1, critical: 0, resolved: 0 },
  { ...day(25), total: 0, critical: 0, resolved: 0 },
  { ...day(24), total: 2, critical: 1, resolved: 1 },
  { ...day(23), total: 1, critical: 0, resolved: 1 },
  { ...day(22), total: 0, critical: 0, resolved: 0 },
  { ...day(21), total: 1, critical: 0, resolved: 0 },
  { ...day(20), total: 1, critical: 0, resolved: 1 },
  { ...day(19), total: 0, critical: 0, resolved: 0 },
  { ...day(18), total: 2, critical: 0, resolved: 2 },
  { ...day(17), total: 1, critical: 0, resolved: 0 },
  { ...day(16), total: 0, critical: 0, resolved: 0 },
  { ...day(15), total: 1, critical: 0, resolved: 1 },
  { ...day(14), total: 2, critical: 1, resolved: 0 },
  { ...day(13), total: 1, critical: 0, resolved: 1 },
  { ...day(12), total: 0, critical: 0, resolved: 0 },
  { ...day(11), total: 1, critical: 0, resolved: 0 },
  { ...day(10), total: 2, critical: 0, resolved: 1 },
  { ...day(9), total: 1, critical: 0, resolved: 1 },
  { ...day(8), total: 1, critical: 0, resolved: 1 },
  { ...day(7), total: 2, critical: 0, resolved: 1 },
  { ...day(6), total: 1, critical: 0, resolved: 0 },
  { ...day(5), total: 2, critical: 1, resolved: 0 },
  { ...day(4), total: 1, critical: 0, resolved: 1 },
  { ...day(3), total: 2, critical: 0, resolved: 0 },
  { ...day(2), total: 1, critical: 0, resolved: 1 },
  { ...day(1), total: 2, critical: 0, resolved: 0 },
  { ...day(0), total: 4, critical: 2, resolved: 0 },
]

export const responseTimeSeries: ResponseTimeDataPoint[] = [
  { ...day(29), responseTime: 58 },
  { ...day(28), responseTime: 55 },
  { ...day(27), responseTime: 52 },
  { ...day(26), responseTime: 54 },
  { ...day(25), responseTime: 51 },
  { ...day(24), responseTime: 57 },
  { ...day(23), responseTime: 53 },
  { ...day(22), responseTime: 50 },
  { ...day(21), responseTime: 49 },
  { ...day(20), responseTime: 52 },
  { ...day(19), responseTime: 48 },
  { ...day(18), responseTime: 51 },
  { ...day(17), responseTime: 47 },
  { ...day(16), responseTime: 50 },
  { ...day(15), responseTime: 46 },
  { ...day(14), responseTime: 49 },
  { ...day(13), responseTime: 45 },
  { ...day(12), responseTime: 48 },
  { ...day(11), responseTime: 44 },
  { ...day(10), responseTime: 47 },
  { ...day(9), responseTime: 43 },
  { ...day(8), responseTime: 46 },
  { ...day(7), responseTime: 42 },
  { ...day(6), responseTime: 45 },
  { ...day(5), responseTime: 41 },
  { ...day(4), responseTime: 44 },
  { ...day(3), responseTime: 40 },
  { ...day(2), responseTime: 43 },
  { ...day(1), responseTime: 68 },
  { ...day(0), responseTime: 112 },
]

export const analyticsMttr = '1h 24m'
