import { internalRequest } from '../lib/internalHttp.js';

function getNotificationServiceUrl() {
    const configured = process.env.NOTIFICATION_SERVICE_URL;
    if (configured && String(configured).trim()) {
        return String(configured).trim().replace(/\/$/, '');
    }

    return 'http://localhost:5001';
}

export async function createIncidentNotification({
    recipientUserId,
    type,
    title,
    message,
    incident
}) {
    try {
        if (typeof recipientUserId !== 'number' || !incident || typeof incident.id !== 'number') {
            return null;
        }

        return await internalRequest(getNotificationServiceUrl(), '/internal/notifications', {
            method: 'POST',
            body: {
                user_id: recipientUserId,
                type,
                title,
                message,
                incident_id: incident.id
            }
        });
    } catch (error) {
        console.error('Failed to create incident notification', error);
        return null;
    }
}
