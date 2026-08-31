import Notification from '../models/Notification.js';
import { parsePositiveInt } from '../middlewares/requireUserId.js';

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

function toPublicNotification(notification) {
    return {
        id: notification.id,
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        is_read: Boolean(notification.isRead),
        incident_id: notification.incident_id ?? null,
        alert_id: notification.alert_id ?? null,
        created_at: toIso(notification.createdAt)
    };
}

function parsePageInt(value, fallback) {
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

function parseOptionalNumericId(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    return parsePositiveInt(value);
}

const listNotifications = async (req, res) => {
    try {
        const pageResult = parsePageInt(req.query.page, DEFAULT_PAGE);
        const pageSizeResult = parsePageInt(req.query.page_size, DEFAULT_PAGE_SIZE);
        const isReadResult = parseIsRead(req.query.is_read);

        if (pageResult.error) {
            return res.status(400).json({ message: 'Invalid page' });
        }

        if (pageSizeResult.error) {
            return res.status(400).json({ message: 'Invalid page_size' });
        }

        if (isReadResult.error) {
            return res.status(400).json({ message: 'Invalid is_read' });
        }

        const page = pageResult.value;
        const pageSize = pageSizeResult.value;
        const filter = { user_id: req.userId };

        if (!isReadResult.missing) {
            filter.isRead = isReadResult.value;
        }

        const total = await Notification.countDocuments(filter);
        const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
        const skip = (page - 1) * pageSize;

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1, id: -1 })
            .skip(skip)
            .limit(pageSize);

        res.status(200).json({
            items: notifications.map(toPublicNotification),
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
        const id = parsePositiveInt(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'Invalid notification ID' });
        }

        const notification = await Notification.findOne({ id, user_id: req.userId });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json(toPublicNotification(notification));
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
            { user_id: req.userId, isRead: false },
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

const createNotification = async (req, res) => {
    try {
        const userId = parsePositiveInt(req.body.user_id);
        const type = typeof req.body.type === 'string' ? req.body.type.trim() : '';
        const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
        const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

        if (!userId) {
            return res.status(400).json({ message: 'user_id is required' });
        }

        if (!type) {
            return res.status(400).json({ message: 'type is required' });
        }

        if (!title) {
            return res.status(400).json({ message: 'title is required' });
        }

        if (!message) {
            return res.status(400).json({ message: 'message is required' });
        }

        const incidentId = parseOptionalNumericId(req.body.incident_id);
        const alertId = parseOptionalNumericId(req.body.alert_id);

        const notification = await Notification.create({
            user_id: userId,
            type,
            title,
            message,
            isRead: false,
            incident_id: incidentId,
            alert_id: alertId
        });

        res.status(201).json(toPublicNotification(notification));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const deleteNotificationsForUser = async (req, res) => {
    try {
        const userId = parsePositiveInt(req.params.userId);
        if (!userId) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const result = await Notification.deleteMany({ user_id: userId });

        res.status(200).json({
            deleted_count: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

export {
    listNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    createNotification,
    deleteNotificationsForUser
};
