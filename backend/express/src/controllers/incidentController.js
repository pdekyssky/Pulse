import Incident, { INCIDENT_STATUSES, INCIDENT_SEVERITIES } from '../models/Incidents.js';
import IncidentEvent from '../models/IncidentEvent.js';
import IncidentComment from '../models/IncidentComment.js';
import Service from '../models/Service.js';
import User from '../models/User.js';

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

const createIncident = async (req, res) => {
    try {
        const incident = await Incident.create(req.body)
        res.status(201).json(incident);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

const updateIncident = async (req, res) => {
    try {
        const incident = await Incident.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        .populate('service')
        .populate('createdBy');

        res.status(200).json(incident);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

const deleteIncident = async (req, res) => {
    try {
        const incident = await Incident.findByIdAndDelete(req.params.id);

        if(!incident) {
            return res.status(404).json({
                message: 'Incident not found'
            });
        }

        res.status(200).json({
            message: 'Incident deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

export { getIncidents, getIncidentById, getIncidentEvents, getIncidentComments, createIncident, updateIncident, deleteIncident };
