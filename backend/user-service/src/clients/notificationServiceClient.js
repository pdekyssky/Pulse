import { internalRequest } from '../lib/internalHttp.js';

function getNotificationServiceUrl() {
    const configured = process.env.NOTIFICATION_SERVICE_URL;
    if (configured && String(configured).trim()) {
        return String(configured).trim().replace(/\/$/, '');
    }

    return 'http://localhost:5001';
}

export async function deleteUserNotifications(userId) {
    try {
        if (typeof userId !== 'number') {
            return null;
        }

        return await internalRequest(
            getNotificationServiceUrl(),
            `/internal/notifications/user/${userId}`,
            { method: 'DELETE' }
        );
    } catch (error) {
        console.error('Failed to delete user notifications', error);
        return null;
    }
}
