import Alert, { ALERT_STATUSES, ALERT_SEVERITIES } from '../models/Alert.js';
import { getServiceById } from '../clients/incidentServiceClient.js';
import { ServiceClientError } from '../lib/internalHttp.js';

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

function toPublicAlert(alert) {
    return {
        id: alert.id,
        name: alert.name,
        description: alert.description ?? null,
        status: alert.status,
        severity: alert.severity,
        service_id: alert.service_id ?? null,
        incident_id: alert.incident_id ?? null,
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
        filter.service_id = parsed.id;
    }

    if (query.incident_id !== undefined && query.incident_id !== '') {
        const parsed = parseNumericId(query.incident_id);
        if (parsed.missing || parsed.error) {
            return { error: 'Invalid incident_id' };
        }
        filter.incident_id = parsed.id;
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
        res.status(400).json({ message: 'Invalid alert ID' });
        return null;
    }

    const alert = await Alert.findOne({ id: parsed.id });
    if (!alert) {
        res.status(404).json({ message: 'Alert not found' });
        return null;
    }

    await alert.ensureNumericId();
    return alert;
}

const getAlerts = async (req, res) => {
    try {
        const pageResult = parsePositiveInt(req.query.page, DEFAULT_PAGE);
        const pageSizeResult = parsePositiveInt(req.query.page_size, DEFAULT_PAGE_SIZE);

        if (pageResult.error) {
            return res.status(400).json({ message: 'Invalid page' });
        }

        if (pageSizeResult.error) {
            return res.status(400).json({ message: 'Invalid page_size' });
        }

        const page = pageResult.value;
        const pageSize = pageSizeResult.value;
        const listFilter = await buildListFilter(req.query);

        if (listFilter.error) {
            return res.status(400).json({ message: listFilter.error });
        }

        if (listFilter.empty) {
            return res.status(200).json(emptyPage(page, pageSize));
        }

        const total = await Alert.countDocuments(listFilter.filter);
        const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
        const skip = (page - 1) * pageSize;

        const alerts = await Alert.find(listFilter.filter)
            .sort({ createdAt: -1, id: -1 })
            .skip(skip)
            .limit(pageSize);

        for (const alert of alerts) {
            await alert.ensureNumericId();
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
            return res.status(400).json({ message: 'Name is required' });
        }

        if (!ALERT_SEVERITIES.includes(severity)) {
            return res.status(400).json({
                message: 'Invalid severity. Must be critical, high, medium, or low'
            });
        }

        const parsedServiceId = parseNumericId(service_id);
        if (parsedServiceId.missing || parsedServiceId.error) {
            return res.status(400).json({ message: 'Invalid service_id' });
        }

        try {
            await getServiceById(parsedServiceId.id);
        } catch (error) {
            if (error instanceof ServiceClientError && (error.status === 404 || error.status === 400)) {
                return res.status(400).json({ message: 'Service not found' });
            }
            throw error;
        }

        const alert = await Alert.create({
            name: trimmedName,
            description: description ? String(description) : null,
            severity,
            status: 'new',
            service_id: parsedServiceId.id,
            incident_id: null
        });

        res.status(201).json(toPublicAlert(alert));
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
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
        res.status(200).json(toPublicAlert(alert));
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
        res.status(200).json(toPublicAlert(alert));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getAlertCounts = async (_req, res) => {
    try {
        const [result] = await Alert.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    grouped: [{ $group: { _id: '$status', count: { $sum: 1 } } }]
                }
            }
        ]);

        const byStatus = { new: 0, acknowledged: 0, resolved: 0 };
        for (const row of result?.grouped ?? []) {
            if (row._id) {
                byStatus[row._id] = row.count;
            }
        }

        res.status(200).json({
            total: result?.total?.[0]?.count ?? 0,
            by_status: byStatus
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getTimelineAlerts = async (req, res) => {
    try {
        const filter = {};
        const serviceId = parseNumericId(req.query.service_id);
        const incidentId = parseNumericId(req.query.incident_id);
        const alertId = parseNumericId(req.query.alert_id);

        if (!serviceId.missing) {
            if (serviceId.error) {
                return res.status(400).json({ message: 'Invalid service_id' });
            }
            filter.service_id = serviceId.id;
        }

        if (!incidentId.missing) {
            if (incidentId.error) {
                return res.status(400).json({ message: 'Invalid incident_id' });
            }
            filter.incident_id = incidentId.id;
        }

        if (!alertId.missing) {
            if (alertId.error) {
                return res.status(400).json({ message: 'Invalid alert_id' });
            }
            filter.id = alertId.id;
        }

        if (req.query.created_after) {
            const cutoff = new Date(req.query.created_after);
            if (!Number.isNaN(cutoff.getTime())) {
                filter.createdAt = { $gte: cutoff };
            }
        }

        const alerts = await Alert.find(filter).sort({ createdAt: -1, id: -1 }).limit(2000);
        res.status(200).json(alerts.map(toPublicAlert));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getReportAlerts = async (req, res) => {
    try {
        const filter = {};
        if (req.query.created_after) {
            const cutoff = new Date(req.query.created_after);
            if (!Number.isNaN(cutoff.getTime())) {
                filter.createdAt = { $gte: cutoff };
            }
        }

        const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(5000);
        res.status(200).json(alerts.map(toPublicAlert));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const unlinkIncident = async (req, res) => {
    try {
        const parsed = parseNumericId(req.params.incidentId);
        if (parsed.missing || parsed.error) {
            return res.status(400).json({ message: 'Invalid incident ID' });
        }

        const result = await Alert.updateMany(
            { incident_id: parsed.id },
            { $set: { incident_id: null } }
        );

        res.status(200).json({ updated_count: result.modifiedCount });
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
    resolveAlert,
    getAlertCounts,
    getTimelineAlerts,
    getReportAlerts,
    unlinkIncident
};
