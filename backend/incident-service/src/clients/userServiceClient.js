import { internalRequest } from '../lib/internalHttp.js';

function getUserServiceUrl() {
    const configured = process.env.USER_SERVICE_URL;
    if (configured && String(configured).trim()) {
        return String(configured).trim().replace(/\/$/, '');
    }

    return 'http://localhost:5002';
}

export async function getUserById(userId, identity = {}) {
    return internalRequest(getUserServiceUrl(), `/internal/users/${userId}`, {
        userId: identity.userId,
        userRole: identity.userRole,
        userName: identity.userName
    });
}

export async function getUsersByIds(ids, identity = {}) {
    if (!ids.length) {
        return [];
    }

    return internalRequest(getUserServiceUrl(), '/internal/users', {
        query: { ids: ids.join(',') },
        userId: identity.userId,
        userRole: identity.userRole,
        userName: identity.userName
    });
}
