import Incident, { INCIDENT_STATUSES, INCIDENT_SEVERITIES } from '../models/Incidents.js';
import IncidentEvent from '../models/IncidentEvent.js';
import IncidentComment from '../models/IncidentComment.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import Alert from '../models/Alert.js';
import {
    createIncidentNotification,
    toUserRefId
} from './notificationController.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 6;
const SORT_FIELDS = {
    started_at: 'startedAt',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    severity: 'severity',
    status: 'status'
};

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

function toPublicIncident(incident) {
    return {
        id: incident.id,
        title: incident.title,
        description: incident.description ?? null,
        status: incident.status,
        severity: incident.severity,
        service_id: numericRefId(incident.service),
        created_by_id: numericRefId(incident.createdBy),
        assigned_to_id: numericRefId(incident.assignedTo),
        started_at: toIso(incident.startedAt) ?? toIso(incident.createdAt),
        resolved_at: toIso(incident.resolvedAt),
        created_at: toIso(incident.createdAt),
        updated_at: toIso(incident.updatedAt)
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

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function populateIncident(query) {
    return query
        .populate({ path: 'service', select: 'id' })
        .populate({ path: 'createdBy', select: 'id' })
        .populate({ path: 'assignedTo', select: 'id' });
}

async function ensureIncidentIds(incident) {
    await incident.ensureNumericId();

    if (incident.service && typeof incident.service.ensureNumericId === 'function') {
        await incident.service.ensureNumericId();
    }

    if (incident.createdBy && typeof incident.createdBy.ensureNumericId === 'function') {
        await incident.createdBy.ensureNumericId();
    }

    if (incident.assignedTo && typeof incident.assignedTo.ensureNumericId === 'function') {
        await incident.assignedTo.ensureNumericId();
    }

    return incident;
}

function parseOptionalDate(value, fieldName) {
    if (value === undefined) {
        return { missing: true };
    }

    if (value === null || value === '') {
        return { value: null };
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return { error: `Invalid ${fieldName}` };
    }

    return { value: date };
}

async function findServiceByNumericId(serviceIdValue) {
    const parsed = parseNumericId(serviceIdValue);

    if (parsed.missing || parsed.error) {
        return { error: 'Invalid service_id' };
    }

    const service = await Service.findOne({ id: parsed.id }).select('_id id');
    if (!service) {
        return { error: 'Service not found' };
    }

    await service.ensureNumericId();
    return { service };
}

async function findUserByNumericId(userIdValue, fieldName) {
    if (userIdValue === null) {
        return { user: null };
    }

    const parsed = parseNumericId(userIdValue);
    if (parsed.missing || parsed.error) {
        return { error: `Invalid ${fieldName}` };
    }

    const user = await User.findOne({ id: parsed.id }).select('_id id');
    if (!user) {
        return { error: 'User not found' };
    }

    if (typeof user.id !== 'number') {
        await user.ensureNumericId();
    }

    return { user };
}

async function loadPublicIncident(mongoId) {
    const incident = await populateIncident(Incident.findById(mongoId));
    await ensureIncidentIds(incident);
    return toPublicIncident(incident);
}

async function buildListFilter(query) {
    const filter = {};

    if (query.status !== undefined && query.status !== '') {
        if (!INCIDENT_STATUSES.includes(query.status)) {
            return { error: 'Invalid status' };
        }
        filter.status = query.status;
    }

    if (query.severity !== undefined && query.severity !== '') {
        if (!INCIDENT_SEVERITIES.includes(query.severity)) {
            return { error: 'Invalid severity' };
        }
        filter.severity = query.severity;
    }

    if (query.service_id !== undefined && query.service_id !== '') {
        const parsed = parseNumericId(query.service_id);
        if (parsed.missing || parsed.error) {
            return { error: 'Invalid service_id' };
        }

        const service = await Service.findOne({ id: parsed.id }).select('_id');
        if (!service) {
            return { empty: true };
        }
        filter.service = service._id;
    }

    if (query.assigned_to_id !== undefined && query.assigned_to_id !== '') {
        const parsed = parseNumericId(query.assigned_to_id);
        if (parsed.missing || parsed.error) {
            return { error: 'Invalid assigned_to_id' };
        }

        const user = await User.findOne({ id: parsed.id }).select('_id');
        if (!user) {
            return { empty: true };
        }
        filter.assignedTo = user._id;
    }

    if (query.search !== undefined && String(query.search).trim().length > 0) {
        const search = String(query.search).trim();
        const incMatch = search.match(/^inc-(\d+)$/i);
        const searchClauses = [];

        if (incMatch) {
            searchClauses.push({ id: Number(incMatch[1]) });
        } else if (/^\d+$/.test(search)) {
            searchClauses.push({ id: Number(search) });
        }

        const regex = new RegExp(escapeRegex(search), 'i');
        searchClauses.push({ title: regex }, { description: regex });
        filter.$or = searchClauses;
    }

    return { filter };
}

function emptyPage(page, pageSize) {
    return {
        items: [],
        page,
        page_size: pageSize,
        total: 0,
        total_pages: 0
    };
}

const getIncidents = async (req, res) => {
    try {
        const pageResult = parsePositiveInt(req.query.page, DEFAULT_PAGE);
        const pageSizeResult = parsePositiveInt(req.query.page_size, DEFAULT_PAGE_SIZE);

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

        const page = pageResult.value;
        const pageSize = pageSizeResult.value;

        let sortField = 'startedAt';
        let sortDirection = -1;

        if (req.query.sort_by !== undefined && req.query.sort_by !== '') {
            const mapped = SORT_FIELDS[req.query.sort_by];
            if (!mapped) {
                return res.status(400).json({
                    message: 'Invalid sort_by'
                });
            }
            sortField = mapped;
        }

        if (req.query.sort_order !== undefined && req.query.sort_order !== '') {
            if (req.query.sort_order !== 'asc' && req.query.sort_order !== 'desc') {
                return res.status(400).json({
                    message: 'Invalid sort_order'
                });
            }
            sortDirection = req.query.sort_order === 'asc' ? 1 : -1;
        }

        const listFilter = await buildListFilter(req.query);

        if (listFilter.error) {
            return res.status(400).json({
                message: listFilter.error
            });
        }

        if (listFilter.empty) {
            return res.status(200).json(emptyPage(page, pageSize));
        }

        const total = await Incident.countDocuments(listFilter.filter);
        const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
        const skip = (page - 1) * pageSize;

        const incidents = await populateIncident(
            Incident.find(listFilter.filter)
                .sort({ [sortField]: sortDirection, createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
        );

        for (const incident of incidents) {
            await ensureIncidentIds(incident);
        }

        res.status(200).json({
            items: incidents.map(toPublicIncident),
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

const getIncidentById = async (req, res) => {
    try {
        const parsed = parseNumericId(req.params.id);

        if (parsed.missing || parsed.error) {
            return res.status(400).json({
                message: 'Invalid incident ID'
            });
        }

        const incident = await populateIncident(Incident.findOne({ id: parsed.id }));

        if (!incident) {
            return res.status(404).json({
                message: 'Incident not found'
            });
        }

        await ensureIncidentIds(incident);

        res.status(200).json(toPublicIncident(incident));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

async function findIncidentByParamId(req, res) {
    const parsed = parseNumericId(req.params.id);

    if (parsed.missing || parsed.error) {
        res.status(400).json({
            message: 'Invalid incident ID'
        });
        return null;
    }

    const incident = await Incident.findOne({ id: parsed.id });

    if (!incident) {
        res.status(404).json({
            message: 'Incident not found'
        });
        return null;
    }

    await incident.ensureNumericId();
    return incident;
}

function toPublicEvent(event, incidentId) {
    return {
        id: event.id,
        incident_id: incidentId,
        author_id: numericRefId(event.author),
        event_type: event.eventType,
        message: event.message,
        created_at: toIso(event.createdAt)
    };
}

function toPublicComment(comment, incidentId) {
    return {
        id: comment.id,
        incident_id: incidentId,
        author_id: numericRefId(comment.author),
        content: comment.content,
        created_at: toIso(comment.createdAt),
        updated_at: toIso(comment.updatedAt)
    };
}

async function ensureAuthorId(doc) {
    await doc.ensureNumericId();

    if (doc.author && typeof doc.author.ensureNumericId === 'function') {
        await doc.author.ensureNumericId();
    }

    return doc;
}

const getIncidentEvents = async (req, res) => {
    try {
        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        const events = await IncidentEvent.find({ incident: incident._id })
            .sort({ createdAt: 1, id: 1 })
            .populate({ path: 'author', select: 'id' });

        for (const event of events) {
            await ensureAuthorId(event);
        }

        res.status(200).json(events.map((event) => toPublicEvent(event, incident.id)));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getIncidentComments = async (req, res) => {
    try {
        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        const comments = await IncidentComment.find({ incident: incident._id })
            .sort({ createdAt: 1, id: 1 })
            .populate({ path: 'author', select: 'id' });

        for (const comment of comments) {
            await ensureAuthorId(comment);
        }

        res.status(200).json(comments.map((comment) => toPublicComment(comment, incident.id)));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

function trimRequiredString(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim();
}

function canModifyComment(comment, user) {
    if (user.role === 'admin') {
        return true;
    }

    return String(comment.author?._id || comment.author) === String(user._id);
}

async function findCommentForIncident(req, res, incident) {
    const parsed = parseNumericId(req.params.commentId);

    if (parsed.missing || parsed.error) {
        res.status(400).json({
            message: 'Invalid comment ID'
        });
        return null;
    }

    const comment = await IncidentComment.findOne({
        id: parsed.id,
        incident: incident._id
    }).populate({ path: 'author', select: 'id' });

    if (!comment) {
        res.status(404).json({
            message: 'Comment not found'
        });
        return null;
    }

    await ensureAuthorId(comment);
    return comment;
}

async function loadPublicEvent(eventMongoId, incidentId) {
    const event = await IncidentEvent.findById(eventMongoId)
        .populate({ path: 'author', select: 'id' });
    await ensureAuthorId(event);
    return toPublicEvent(event, incidentId);
}

async function loadPublicComment(commentMongoId, incidentId) {
    const comment = await IncidentComment.findById(commentMongoId)
        .populate({ path: 'author', select: 'id' });
    await ensureAuthorId(comment);
    return toPublicComment(comment, incidentId);
}

const createIncidentEvent = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        const eventType = trimRequiredString(req.body.event_type);
        const message = trimRequiredString(req.body.message);

        if (!eventType) {
            return res.status(400).json({
                message: 'Event type is required'
            });
        }

        if (!message) {
            return res.status(400).json({
                message: 'Message is required'
            });
        }

        const event = await IncidentEvent.create({
            incident: incident._id,
            author: req.user._id,
            eventType,
            message
        });

        const assigneeId = toUserRefId(incident.assignedTo);
        const authorId = toUserRefId(req.user._id);
        if (assigneeId && assigneeId !== authorId) {
            await createIncidentNotification({
                recipientUserId: incident.assignedTo,
                type: 'incident_event',
                title: 'New investigation event',
                message: `${req.user.name} added an event on INC-${incident.id} "${incident.title}".`,
                incident
            });
        }

        res.status(201).json(await loadPublicEvent(event._id, incident.id));
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const createIncidentComment = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        const content = trimRequiredString(req.body.content);
        if (!content) {
            return res.status(400).json({
                message: 'Content is required'
            });
        }

        const comment = await IncidentComment.create({
            incident: incident._id,
            author: req.user._id,
            content
        });

        const assigneeId = toUserRefId(incident.assignedTo);
        const authorId = toUserRefId(req.user._id);
        if (assigneeId && assigneeId !== authorId) {
            await createIncidentNotification({
                recipientUserId: incident.assignedTo,
                type: 'incident_comment',
                title: 'New comment on incident',
                message: `${req.user.name} commented on INC-${incident.id} "${incident.title}".`,
                incident
            });
        }

        res.status(201).json(await loadPublicComment(comment._id, incident.id));
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const updateIncidentComment = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        const comment = await findCommentForIncident(req, res, incident);
        if (!comment) {
            return;
        }

        if (!canModifyComment(comment, req.user)) {
            return res.status(403).json({
                message: 'Forbidden'
            });
        }

        const content = trimRequiredString(req.body.content);
        if (!content) {
            return res.status(400).json({
                message: 'Content is required'
            });
        }

        comment.content = content;
        await comment.save({ validateModifiedOnly: true });

        res.status(200).json(await loadPublicComment(comment._id, incident.id));
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const deleteIncidentComment = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        const comment = await findCommentForIncident(req, res, incident);
        if (!comment) {
            return;
        }

        if (!canModifyComment(comment, req.user)) {
            return res.status(403).json({
                message: 'Forbidden'
            });
        }

        await comment.deleteOne();

        res.status(200).json({
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const createIncident = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        const { title, description, severity, service_id } = req.body;
        const trimmedTitle = typeof title === 'string' ? title.trim() : '';

        if (!trimmedTitle) {
            return res.status(400).json({
                message: 'Title is required'
            });
        }

        if (description === undefined) {
            return res.status(400).json({
                message: 'Description is required'
            });
        }

        if (description !== null && typeof description !== 'string') {
            return res.status(400).json({
                message: 'Invalid description'
            });
        }

        if (!INCIDENT_SEVERITIES.includes(severity)) {
            return res.status(400).json({
                message: 'Invalid severity. Must be critical, high, medium, or low'
            });
        }

        const serviceResult = await findServiceByNumericId(service_id);
        if (serviceResult.error) {
            return res.status(400).json({
                message: serviceResult.error
            });
        }

        const startedAtResult = parseOptionalDate(req.body.started_at, 'started_at');
        if (startedAtResult.error) {
            return res.status(400).json({
                message: startedAtResult.error
            });
        }

        const incident = await Incident.create({
            title: trimmedTitle,
            description: typeof description === 'string' && description.trim() ? description.trim() : null,
            status: 'investigating',
            severity,
            service: serviceResult.service._id,
            createdBy: req.user._id,
            assignedTo: null,
            startedAt: startedAtResult.missing || startedAtResult.value === null
                ? new Date()
                : startedAtResult.value,
            resolvedAt: null
        });

        res.status(201).json(await loadPublicIncident(incident._id));
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const updateIncident = async (req, res) => {
    try {
        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'created_by_id')) {
            return res.status(400).json({
                message: 'created_by_id cannot be changed'
            });
        }

        const previousAssigneeId = toUserRefId(incident.assignedTo);
        const previousStatus = incident.status;

        const {
            title,
            description,
            status,
            severity,
            service_id,
            assigned_to_id,
            started_at,
            resolved_at
        } = req.body;

        if (title !== undefined) {
            const trimmedTitle = typeof title === 'string' ? title.trim() : '';
            if (!trimmedTitle) {
                return res.status(400).json({
                    message: 'Title is required'
                });
            }
            incident.title = trimmedTitle;
        }

        if (description !== undefined) {
            if (description !== null && typeof description !== 'string') {
                return res.status(400).json({
                    message: 'Invalid description'
                });
            }
            incident.description = typeof description === 'string' && description.trim()
                ? description.trim()
                : null;
        }

        if (severity !== undefined && severity !== null) {
            if (!INCIDENT_SEVERITIES.includes(severity)) {
                return res.status(400).json({
                    message: 'Invalid severity. Must be critical, high, medium, or low'
                });
            }
            incident.severity = severity;
        }

        if (service_id !== undefined) {
            if (service_id === null) {
                return res.status(400).json({
                    message: 'Invalid service_id'
                });
            }

            const serviceResult = await findServiceByNumericId(service_id);
            if (serviceResult.error) {
                return res.status(400).json({
                    message: serviceResult.error
                });
            }
            incident.service = serviceResult.service._id;
        }

        if (assigned_to_id !== undefined) {
            const userResult = await findUserByNumericId(assigned_to_id, 'assigned_to_id');
            if (userResult.error) {
                return res.status(400).json({
                    message: userResult.error
                });
            }
            incident.assignedTo = userResult.user ? userResult.user._id : null;
        }

        if (started_at !== undefined) {
            const startedAtResult = parseOptionalDate(started_at, 'started_at');
            if (startedAtResult.error) {
                return res.status(400).json({
                    message: startedAtResult.error
                });
            }
            if (startedAtResult.value) {
                incident.startedAt = startedAtResult.value;
            }
        }

        if (status !== undefined && status !== null) {
            if (!INCIDENT_STATUSES.includes(status)) {
                return res.status(400).json({
                    message: 'Invalid status. Must be investigating, identified, monitoring, or resolved'
                });
            }
            incident.status = status;
        }

        const resolvedAtResult = parseOptionalDate(resolved_at, 'resolved_at');
        if (resolvedAtResult.error) {
            return res.status(400).json({
                message: resolvedAtResult.error
            });
        }

        if (incident.status === 'resolved') {
            if (!resolvedAtResult.missing && resolvedAtResult.value) {
                incident.resolvedAt = resolvedAtResult.value;
            } else if (!incident.resolvedAt) {
                incident.resolvedAt = new Date();
            }
        } else if (previousStatus === 'resolved' && incident.status !== 'resolved') {
            incident.resolvedAt = null;
        } else if (!resolvedAtResult.missing && resolvedAtResult.value === null) {
            incident.resolvedAt = null;
        } else if (!resolvedAtResult.missing && resolvedAtResult.value) {
            incident.resolvedAt = resolvedAtResult.value;
        }

        await incident.save({ validateModifiedOnly: true });

        const nextAssigneeId = toUserRefId(incident.assignedTo);
        const actorId = toUserRefId(req.user?._id);
        const assignmentChanged = assigned_to_id !== undefined && nextAssigneeId !== previousAssigneeId;
        const statusChanged = incident.status !== previousStatus;

        if (assignmentChanged && nextAssigneeId && nextAssigneeId !== actorId) {
            await createIncidentNotification({
                recipientUserId: incident.assignedTo,
                type: 'incident_assigned',
                title: 'Incident assigned to you',
                message: `INC-${incident.id} "${incident.title}" was assigned to you.`,
                incident
            });
        }

        if (statusChanged && nextAssigneeId && nextAssigneeId !== actorId) {
            await createIncidentNotification({
                recipientUserId: incident.assignedTo,
                type: 'incident_status_changed',
                title: `Incident status changed to ${incident.status}`,
                message: `INC-${incident.id} "${incident.title}" is now ${incident.status}.`,
                incident
            });
        }

        res.status(200).json(await loadPublicIncident(incident._id));
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const deleteIncident = async (req, res) => {
    try {
        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        await IncidentEvent.deleteMany({ incident: incident._id });
        await IncidentComment.deleteMany({ incident: incident._id });
        await Alert.updateMany(
            { incident: incident._id },
            { $set: { incident: null } }
        );
        await incident.deleteOne();

        res.status(200).json({
            message: 'Incident deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

export { getIncidents, getIncidentById, getIncidentEvents, getIncidentComments, createIncident, updateIncident, deleteIncident, createIncidentEvent, createIncidentComment, updateIncidentComment, deleteIncidentComment };
