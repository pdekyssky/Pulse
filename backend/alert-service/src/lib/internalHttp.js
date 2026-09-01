const REQUEST_TIMEOUT_MS = 5000;

export class ServiceClientError extends Error {
    constructor(status, message, cause) {
        super(message);
        this.name = 'ServiceClientError';
        this.status = status;
        this.cause = cause;
    }
}

function getInternalApiKey() {
    const key = process.env.INTERNAL_API_KEY;
    if (key && String(key).trim()) {
        return String(key).trim();
    }

    return null;
}

export async function internalRequest(baseUrl, path, {
    method = 'GET',
    body,
    query,
    userId,
    userRole,
    userName,
    requestId
} = {}) {
    const url = new URL(path, `${String(baseUrl).replace(/\/$/, '')}/`);

    if (query && typeof query === 'object') {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, String(value));
            }
        }
    }

    const apiKey = getInternalApiKey();
    if (!apiKey) {
        throw new ServiceClientError(500, 'INTERNAL_API_KEY is not configured');
    }

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
    };

    if (userId !== undefined && userId !== null && userId !== '') {
        headers['X-User-Id'] = String(userId);
    }

    if (userRole) {
        headers['X-User-Role'] = String(userRole);
    }

    if (userName) {
        headers['X-User-Name'] = String(userName);
    }

    if (requestId) {
        headers['X-Request-Id'] = String(requestId);
    }

    let response;
    try {
        response = await fetch(url, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
    } catch (error) {
        throw new ServiceClientError(503, 'Service unavailable', error);
    }

    let json = null;
    const text = await response.text();
    if (text) {
        try {
            json = JSON.parse(text);
        } catch {
            json = { message: text };
        }
    }

    if (!response.ok) {
        const message = json?.message || 'Service request failed';
        throw new ServiceClientError(response.status, message);
    }

    return json;
}
