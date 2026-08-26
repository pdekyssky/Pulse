/**
 * Incident ID helper for public integer IDs (inc-123 or 123).
 */

export function parseIncidentNumericId(id: string): number | null {
  const parsed = Number.parseInt(id.replace(/^inc-/i, ''), 10)
  return Number.isNaN(parsed) ? null : parsed
}
