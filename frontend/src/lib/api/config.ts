const DEFAULT_API_BASE_URL = 'http://localhost:5000'
const API_PREFIX = '/api/v1'

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
}

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}${API_PREFIX}${normalizedPath}`
}
