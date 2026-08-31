const DEFAULT_NOTIFICATION_SERVICE_URL = 'http://localhost:5001';
const REQUEST_TIMEOUT_MS = 5000;

function getNotificationServiceUrl() {
    const configured = process.env.NOTIFICATION_SERVICE_URL;
    if (configured && String(configured).trim()) {
        return String(configured).trim().replace(/\/$/, '');
    }

    return DEFAULT_NOTIFICATION_SERVICE_URL;
}

export class NotificationServiceError extends Error {
    constructor(status, message, cause) {
        super(message);
        this.name = 'NotificationServiceError';
        this.status = status;
        this.cause = cause;
    }
}

export async function notificationServiceRequest(path, { method = 'GET', userId, body, query } = {}) {
    const url = new URL(path, `${getNotificationServiceUrl()}/`);

    if (query && typeof query === 'object') {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, String(value));
            }
        }
    }

    const headers = {
        'Content-Type': 'application/json'
    };

    if (userId !== undefined && userId !== null && userId !== '') {
        headers['X-User-Id'] = String(userId);
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
        throw new NotificationServiceError(503, 'Notification service unavailable', error);
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
        const message = json?.message || 'Notification service request failed';
        throw new NotificationServiceError(response.status, message);
    }

    return json;
}
