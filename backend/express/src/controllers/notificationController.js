import User from '../models/User.js';
import { notificationServiceRequest, NotificationServiceError } from '../lib/notificationServiceClient.js';

function toUserRefId(value) {
    if (!value) {
        return null;
    }

    if (typeof value === 'object' && value._id) {
        return String(value._id);
    }

    return String(value);
}

function parsePublicUserId(value) {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1) {
        return value;
    }

    if (typeof value === 'object' && typeof value.id === 'number') {
        return value.id;
    }

    return null;
}

async function resolvePublicUserId(recipientUserId) {
    const directId = parsePublicUserId(recipientUserId);
    if (directId) {
        return directId;
    }

    if (!recipientUserId) {
        return null;
    }

    const mongoId = typeof recipientUserId === 'object' && recipientUserId._id
        ? recipientUserId._id
        : recipientUserId;

    const user = await User.findById(mongoId).select('id');
    if (!user) {
        return null;
    }

    await user.ensureNumericId();
    return typeof user.id === 'number' ? user.id : null;
}

/**
 * Create an in-app notification via the Notification Service.
 * Failures are logged and do not throw, so the originating mutation still succeeds.
 */
async function createIncidentNotification({
    recipientUserId,
    type,
    title,
    message,
    incident
}) {
    try {
        const userId = await resolvePublicUserId(recipientUserId);
        if (!userId) {
            return null;
        }

        if (!incident || typeof incident.id !== 'number') {
            return null;
        }

        return await notificationServiceRequest('/internal/notifications', {
            method: 'POST',
            body: {
                user_id: userId,
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

async function deleteUserNotifications(userId) {
    try {
        if (typeof userId !== 'number') {
            return null;
        }

        return await notificationServiceRequest(`/internal/notifications/user/${userId}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Failed to delete user notifications', error);
        return null;
    }
}

function proxyError(res, error) {
    if (error instanceof NotificationServiceError) {
        return res.status(error.status).json({
            message: error.message
        });
    }

    return res.status(500).json({
        message: 'Internal server error',
        error: error.message
    });
}

const getNotifications = async (req, res) => {
    try {
        await req.user.ensureNumericId();

        const payload = await notificationServiceRequest('/internal/notifications', {
            userId: req.user.id,
            query: {
                page: req.query.page,
                page_size: req.query.page_size,
                is_read: req.query.is_read
            }
        });

        res.status(200).json(payload);
    } catch (error) {
        return proxyError(res, error);
    }
};

const markNotificationRead = async (req, res) => {
    try {
        await req.user.ensureNumericId();

        const payload = await notificationServiceRequest(
            `/internal/notifications/${req.params.id}/read`,
            {
                method: 'PATCH',
                userId: req.user.id
            }
        );

        res.status(200).json(payload);
    } catch (error) {
        return proxyError(res, error);
    }
};

const markAllNotificationsRead = async (req, res) => {
    try {
        await req.user.ensureNumericId();

        const payload = await notificationServiceRequest('/internal/notifications/read-all', {
            method: 'PATCH',
            userId: req.user.id
        });

        res.status(200).json(payload);
    } catch (error) {
        return proxyError(res, error);
    }
};

export {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    createIncidentNotification,
    deleteUserNotifications,
    toUserRefId
};
