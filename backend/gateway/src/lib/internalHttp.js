const REQUEST_TIMEOUT_MS = 5000;

export class GatewayError extends Error {
    constructor(status, message, cause) {
        super(message);
        this.name = 'GatewayError';
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

export function serviceUrl(name, fallback) {
    const configured = process.env[name];
    if (configured && String(configured).trim()) {
        return String(configured).trim().replace(/\/$/, '');
    }

    return fallback;
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
            if (Array.isArray(value)) {
                for (const item of value) {
                    url.searchParams.append(key, String(item));
                }
            } else if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, String(value));
            }
        }
    }

    const apiKey = getInternalApiKey();
    if (!apiKey) {
        throw new GatewayError(500, 'INTERNAL_API_KEY is not configured');
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
        throw new GatewayError(503, 'Service unavailable', error);
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

    return {
        status: response.status,
        ok: response.ok,
        json
    };
}

export async function internalRequestOk(baseUrl, path, options) {
    const result = await internalRequest(baseUrl, path, options);
    if (!result.ok) {
        throw new GatewayError(
            result.status,
            result.json?.message || 'Service request failed'
        );
    }

    return result.json;
}

export async function proxyToService(req, res, baseUrl, internalPath) {
    try {
        const hasBody = !['GET', 'HEAD'].includes(req.method);
        const result = await internalRequest(baseUrl, internalPath, {
            method: req.method,
            body: hasBody ? req.body : undefined,
            query: req.query,
            userId: req.user?.id,
            userRole: req.user?.role,
            userName: req.user?.name,
            requestId: req.requestId
        });

        return res.status(result.status).json(result.json);
    } catch (error) {
        if (error instanceof GatewayError) {
            return res.status(error.status).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}
