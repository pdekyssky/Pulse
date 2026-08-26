import Notification from '../models/Notification.js';

function toUserRefId(value) {
    if (!value) {
        return null;
    }

    if (typeof value === 'object' && value._id) {
        return String(value._id);
    }

    return String(value);
}

/**
 * Create an in-app notification for an identified user.
 * Failures are logged and do not throw, so the originating mutation still succeeds.
 */
async function createIncidentNotification({
    recipientUserId,
    type,
    title,
    message,
    incident
}) {
    const userId = toUserRefId(recipientUserId);
    if (!userId) {
        return null;
    }

    if (!incident || !incident._id) {
        return null;
    }

    try {
        return await Notification.create({
            user: userId,
            type,
            title,
            message,
            incident: incident._id,
            isRead: false
        });
    } catch (error) {
        console.error('Failed to create incident notification', error);
        return null;
    }
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 6;

function toIso(value) {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

function numericRefId(doc) {
    if (doc && typeof doc === 'object' && typeof doc.id === 'number') {
        return doc.id;
    }

    return null;
}

function toPublicNotification(notification, userId) {
    return {
        id: notification.id,
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        is_read: Boolean(notification.isRead),
        incident_id: numericRefId(notification.incident),
        alert_id: numericRefId(notification.alert),
        created_at: toIso(notification.createdAt)
    };
}

function parseNumericId(value) {
    if (value === undefined || value === null || value === '') {
        return { missing: true };
    }

    if (!/^\d+$/.test(String(value).trim())) {
        return { error: true };
    }

    const id = Number(value);

    if (!Number.isInteger(id) || id < 1) {
        return { error: true };
    }

    return { id };
}

function parsePositiveInt(value, fallback) {
    if (value === undefined || value === null || value === '') {
        return { value: fallback };
    }

    if (!/^\d+$/.test(String(value).trim())) {
        return { error: true };
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
        return { error: true };
    }

    return { value: parsed };
}

function parseIsRead(value) {
    if (value === undefined || value === '') {
        return { missing: true };
    }

    if (value === true || value === 'true') {
        return { value: true };
    }

    if (value === false || value === 'false') {
        return { value: false };
    }

    return { error: true };
}

function populateNotification(query) {
    return query
        .populate({ path: 'incident', select: 'id' })
        .populate({ path: 'alert', select: 'id' });
}

async function ensureNotificationIds(notification) {
    await notification.ensureNumericId();

    if (notification.incident && typeof notification.incident.ensureNumericId === 'function') {
        await notification.incident.ensureNumericId();
    }

    if (notification.alert && typeof notification.alert.ensureNumericId === 'function') {
        await notification.alert.ensureNumericId();
    }

    return notification;
}

const getNotifications = async (req, res) => {
    try {
        await req.user.ensureNumericId();

        const pageResult = parsePositiveInt(req.query.page, DEFAULT_PAGE);
        const pageSizeResult = parsePositiveInt(req.query.page_size, DEFAULT_PAGE_SIZE);
        const isReadResult = parseIsRead(req.query.is_read);

        if (pageResult.error) {
            return res.status(400).json({
                message: 'Invalid page'
            });
        }

        if (pageSizeResult.error) {
            return res.status(400).json({
                message: 'Invalid page_size'
            });
        }

        if (isReadResult.error) {
            return res.status(400).json({
                message: 'Invalid is_read'
            });
        }

        const page = pageResult.value;
        const pageSize = pageSizeResult.value;
        const filter = { user: req.user._id };

        if (!isReadResult.missing) {
            filter.isRead = isReadResult.value;
        }

        const total = await Notification.countDocuments(filter);
        const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
        const skip = (page - 1) * pageSize;

        const notifications = await populateNotification(
            Notification.find(filter)
                .sort({ createdAt: -1, id: -1 })
                .skip(skip)
                .limit(pageSize)
        );

        for (const notification of notifications) {
            await ensureNotificationIds(notification);
        }

        res.status(200).json({
            items: notifications.map((notification) =>
                toPublicNotification(notification, req.user.id)
            ),
            page,
            page_size: pageSize,
            total,
            total_pages: totalPages
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        await req.user.ensureNumericId();

        const parsed = parseNumericId(req.params.id);

        if (parsed.missing || parsed.error) {
            return res.status(400).json({
                message: 'Invalid notification ID'
            });
        }

        const notification = await populateNotification(
            Notification.findOne({ id: parsed.id, user: req.user._id })
        );

        if (!notification) {
            return res.status(404).json({
                message: 'Notification not found'
            });
        }

        notification.isRead = true;
        await notification.save();
        await ensureNotificationIds(notification);

        res.status(200).json(toPublicNotification(notification, req.user.id));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const markAllNotificationsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({
            updated_count: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

export {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    createIncidentNotification,
    toUserRefId
};
