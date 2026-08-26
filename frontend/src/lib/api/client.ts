import { getApiUrl } from './config.ts'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function parseErrorDetail(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload
  }

  if (payload && typeof payload === 'object') {
    if ('detail' in payload && typeof payload.detail === 'string') {
      return payload.detail
    }

    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
  }

  return 'Request failed'
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const url = getApiUrl(path)
  const method = (options.method ?? 'GET').toUpperCase()
  let response: Response

  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })
  } catch (error) {
    const reason =
      error instanceof Error && error.message
        ? error.message
        : 'Network request failed'

    throw new ApiError(0, `${method} ${url} failed: ${reason}`)
  }

  if (!response.ok) {
    let detail = response.statusText

    try {
      detail = parseErrorDetail(await response.json())
    } catch {
      // Keep default status text when the body is not JSON.
    }

    throw new ApiError(response.status, detail)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
