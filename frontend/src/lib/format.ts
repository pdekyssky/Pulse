/**
 * Formatting helpers for dates, durations, and display values.
 */

export function formatIncidentId(id: string): string {
  const numeric = id.replace(/^inc-/i, '')
  if (/^\d+$/.test(numeric)) {
    return `INC-${numeric}`
  }
  return id.toUpperCase()
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60_000))

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatJoinDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatUptime(uptime: number): string {
  return `${uptime.toFixed(2)}%`
}

export function formatResponseTime(ms: number): string {
  if (ms === 0) {
    return '—'
  }

  return `${ms} ms`
}

export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)

  const startOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const endOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }

  const sameYear = startDate.getFullYear() === endDate.getFullYear()
  if (sameYear && startDate.getMonth() === endDate.getMonth()) {
    const lastDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate()
    // Collapse full calendar months to a single label (e.g. "August 2026")
    if (startDate.getDate() === 1 && endDate.getDate() === lastDay) {
      return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  }

  const startFormatted = startDate.toLocaleDateString('en-US', startOpts)
  const endFormatted = endDate.toLocaleDateString('en-US', endOpts)
  return `${startFormatted} – ${endFormatted}`
}

export function formatDurationFromSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return '—'
  }

  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  if (totalMinutes > 0) {
    return `${totalMinutes}m`
  }

  return `${Math.round(seconds)}s`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
