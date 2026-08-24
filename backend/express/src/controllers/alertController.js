import Alert, { ALERT_STATUSES, ALERT_SEVERITIES } from '../models/Alert.js';
import Service from '../models/Service.js';
import Incident from '../models/Incidents.js';

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

function toPublicAlert(alert) {
    return {
        id: alert.id,
        name: alert.name,
        description: alert.description ?? null,
        status: alert.status,
        severity: alert.severity,
        service_id: numericRefId(alert.service),
        incident_id: numericRefId(alert.incident),
        created_at: toIso(alert.createdAt),
        updated_at: toIso(alert.updatedAt)
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

function populateAlert(query) {
    return query
        .populate({ path: 'service', select: 'id' })
        .populate({ path: 'incident', select: 'id' });
}

async function ensureAlertIds(alert) {
    await alert.ensureNumericId();

    if (alert.service && typeof alert.service.ensureNumericId === 'function') {
        await alert.service.ensureNumericId();
    }

    if (alert.incident && typeof alert.incident.ensureNumericId === 'function') {
        await alert.incident.ensureNumericId();
    }

    return alert;
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

async function buildListFilter(query) {
    const filter = {};

    if (query.status !== undefined && query.status !== '') {
        if (!ALERT_STATUSES.includes(query.status)) {
            return { error: 'Invalid status' };
        }
        filter.status = query.status;
    }

    if (query.severity !== undefined && query.severity !== '') {
        if (!ALERT_SEVERITIES.includes(query.severity)) {
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

    if (query.incident_id !== undefined && query.incident_id !== '') {
        const parsed = parseNumericId(query.incident_id);
        if (parsed.missing || parsed.error) {
            return { error: 'Invalid incident_id' };
        }

        const incident = await Incident.findOne({ id: parsed.id }).select('_id');
        if (!incident) {
            return { empty: true };
        }
        filter.incident = incident._id;
    }

    if (query.search !== undefined && String(query.search).trim().length > 0) {
        const search = String(query.search).trim();
        const regex = new RegExp(escapeRegex(search), 'i');
        filter.$or = [{ name: regex }, { description: regex }];
    }

    return { filter };
}

async function findAlertByParamId(req, res) {
    const parsed = parseNumericId(req.params.id);

    if (parsed.missing || parsed.error) {
        res.status(400).json({
            message: 'Invalid alert ID'
        });
        return null;
    }

    const alert = await populateAlert(Alert.findOne({ id: parsed.id }));

    if (!alert) {
        res.status(404).json({
            message: 'Alert not found'
        });
        return null;
    }

    await ensureAlertIds(alert);
    return alert;
}

const getAlerts = async (req, res) => {
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
        const listFilter = await buildListFilter(req.query);

        if (listFilter.error) {
            return res.status(400).json({
                message: listFilter.error
            });
        }

        if (listFilter.empty) {
            return res.status(200).json(emptyPage(page, pageSize));
        }

        const total = await Alert.countDocuments(listFilter.filter);
        const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
        const skip = (page - 1) * pageSize;

        const alerts = await populateAlert(
            Alert.find(listFilter.filter)
                .sort({ createdAt: -1, id: -1 })
                .skip(skip)
                .limit(pageSize)
        );

        for (const alert of alerts) {
            await ensureAlertIds(alert);
        }

        res.status(200).json({
            items: alerts.map(toPublicAlert),
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

const createAlert = async (req, res) => {
    try {
        const { name, description, severity, service_id } = req.body;
        const trimmedName = typeof name === 'string' ? name.trim() : '';

        if (!trimmedName) {
            return res.status(400).json({
                message: 'Name is required'
            });
        }

        if (!ALERT_SEVERITIES.includes(severity)) {
            return res.status(400).json({
                message: 'Invalid severity. Must be critical, high, medium, or low'
            });
        }

        const parsedServiceId = parseNumericId(service_id);
        if (parsedServiceId.missing || parsedServiceId.error) {
            return res.status(400).json({
                message: 'Invalid service_id'
            });
        }

        const service = await Service.findOne({ id: parsedServiceId.id }).select('id');
        if (!service) {
            return res.status(400).json({
                message: 'Service not found'
            });
        }

        await service.ensureNumericId();

        const alert = await Alert.create({
            name: trimmedName,
            description: description ? String(description) : null,
            severity,
            status: 'new',
            service: service._id,
            incident: null
        });

        const created = await populateAlert(Alert.findById(alert._id));
        await ensureAlertIds(created);

        res.status(201).json(toPublicAlert(created));
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

const acknowledgeAlert = async (req, res) => {
    try {
        const alert = await findAlertByParamId(req, res);
        if (!alert) {
            return;
        }

        if (alert.status !== 'new') {
            return res.status(400).json({
                message: 'Only new alerts can be acknowledged'
            });
        }

        alert.status = 'acknowledged';
        await alert.save();

        const updated = await populateAlert(Alert.findById(alert._id));
        await ensureAlertIds(updated);

        res.status(200).json(toPublicAlert(updated));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const resolveAlert = async (req, res) => {
    try {
        const alert = await findAlertByParamId(req, res);
        if (!alert) {
            return;
        }

        if (alert.status !== 'acknowledged') {
            return res.status(400).json({
                message: 'Only acknowledged alerts can be resolved'
            });
        }

        alert.status = 'resolved';
        await alert.save();

        const updated = await populateAlert(Alert.findById(alert._id));
        await ensureAlertIds(updated);

        res.status(200).json(toPublicAlert(updated));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

export {
    getAlerts,
    createAlert,
    acknowledgeAlert,
    resolveAlert
};
