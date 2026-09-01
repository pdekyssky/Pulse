import { internalRequest } from '../lib/internalHttp.js';

function getIncidentServiceUrl() {
    const configured = process.env.INCIDENT_SERVICE_URL;
    if (configured && String(configured).trim()) {
        return String(configured).trim().replace(/\/$/, '');
    }

    return 'http://localhost:5003';
}

export async function unassignUser(userId) {
    try {
        if (typeof userId !== 'number') {
            return null;
        }

        return await internalRequest(
            getIncidentServiceUrl(),
            `/internal/users/${userId}/unassign`,
            { method: 'POST' }
        );
    } catch (error) {
        console.error('Failed to unassign user from incidents', error);
        return null;
    }
}
