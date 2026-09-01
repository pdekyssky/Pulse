import Incident from '../models/Incidents.js';
import IncidentEvent from '../models/IncidentEvent.js';
import Service from '../models/Service.js';
import { getTimelineAlerts } from '../clients/alertServiceClient.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 6;

const TIMELINE_TYPES = [
    'incident_created',
    'incident_updated',
    'incident_resolved',
    'alert_triggered',
    'alert_acknowledged',
    'service_degraded',
    'service_recovered',
    'deployment',
    'maintenance'
];

const TIMELINE_PERIODS = ['all', 'today', '7d', '30d'];
const TIMELINE_SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'info']);

const INCIDENT_EVENT_TYPE_MAP = {
    status_change: 'incident_updated',
    severity_change: 'incident_updated',
    assignment: 'incident_updated',
    alert_linked: 'incident_updated',
    alert_unlinked: 'incident_updated',
    comment: 'incident_updated',
    comment_edited: 'incident_updated',
    comment_deleted: 'incident_updated',
    resolution: 'incident_resolved'
};

const INCIDENT_TYPES = new Set(['incident_created', 'incident_updated', 'incident_resolved']);
const ALERT_TYPES = new Set(['alert_triggered', 'alert_acknowledged']);
const SERVICE_TYPES = new Set([
    'service_degraded',
    'service_recovered',
    'deployment',
    'maintenance'
]);

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

function toDate(value) {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function numericId(value) {
    if (typeof value === 'number') {
        return value;
    }

    if (value && typeof value === 'object' && typeof value.id === 'number') {
        return value.id;
    }

    return null;
}

function mapSeverity(value) {
    if (TIMELINE_SEVERITIES.has(value)) {
        return value;
    }

    return null;
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

function periodStart(period) {
    if (!period || period === 'all') {
        return null;
    }

    const now = new Date();

    if (period === 'today') {
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }

    if (period === '7d') {
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    if (period === '30d') {
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return null;
}

function todayStartUtc() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function makeEvent({
    id,
    timestamp,
    type,
    title,
    description,
    serviceId,
    incidentId,
    alertId,
    severity
}) {
    return {
        id,
        timestamp: toIso(timestamp),
        type,
        title,
        description,
        service_id: serviceId ?? null,
        incident_id: incidentId ?? null,
        alert_id: alertId ?? null,
        severity: severity ?? null
    };
}

function emptyPage(page, pageSize) {
    return {
        items: [],
        page,
        page_size: pageSize,
        total: 0,
        total_pages: 0,
        stats: {
            events_today: 0,
            incidents: 0,
            alerts: 0,
            service_events: 0
        }
    };
}

function computeStats(events) {
    const start = todayStartUtc();

    return {
        events_today: events.filter((event) => new Date(event.timestamp) >= start).length,
        incidents: events.filter((event) => INCIDENT_TYPES.has(event.type)).length,
        alerts: events.filter((event) => ALERT_TYPES.has(event.type)).length,
        service_events: events.filter((event) => SERVICE_TYPES.has(event.type)).length
    };
}

async function loadActiveIncidentIdsByService(serviceIds) {
    const uniqueIds = [...new Set(serviceIds.filter((id) => typeof id === 'number'))];
    const map = new Map();

    if (uniqueIds.length === 0) {
        return map;
    }

    const active = await Incident.find({
        service_id: { $in: uniqueIds },
        status: { $ne: 'resolved' }
    }).select('id service_id');

    for (const incident of active) {
        const key = String(incident.service_id);
        if (!map.has(key)) {
            map.set(key, new Set());
        }
        map.get(key).add(String(incident.id));
    }

    return map;
}

function serviceHasOtherActiveIncidents(activeByService, serviceId, incidentId) {
    const activeIds = activeByService.get(String(serviceId));
    if (!activeIds) {
        return false;
    }

    for (const id of activeIds) {
        if (id !== String(incidentId)) {
            return true;
        }
    }

    return false;
}

async function ensureRelatedIds(incident) {
    await incident.ensureNumericId();
    return incident;
}

async function collectIncidentEventItems({ cutoff, service, incident }) {
    const items = [];
    const resolutionIncidentIds = new Set();
    const eventQuery = {};

    if (cutoff) {
        eventQuery.createdAt = { $gte: cutoff };
    }

    const incidentFilter = {};
    if (service) {
        incidentFilter.service_id = service.id;
    }
    if (incident) {
        incidentFilter.id = incident.id;
    }

    if (Object.keys(incidentFilter).length > 0) {
        const matchingIncidents = await Incident.find(incidentFilter).select('id');
        eventQuery.incident_id = { $in: matchingIncidents.map((doc) => doc.id) };
    }

    const eventDocs = await IncidentEvent.find(eventQuery);
    const incidentIds = [...new Set(eventDocs.map((eventDoc) => eventDoc.incident_id).filter(Boolean))];
    const relatedIncidents = await Incident.find({ id: { $in: incidentIds } });
    const incidentById = new Map(relatedIncidents.map((doc) => [doc.id, doc]));

    const serviceIds = relatedIncidents.map((doc) => doc.service_id).filter((id) => typeof id === 'number');
    const activeByService = await loadActiveIncidentIdsByService(serviceIds);

    for (const eventDoc of eventDocs) {
        const relatedIncident = incidentById.get(eventDoc.incident_id);
        if (!relatedIncident) {
            continue;
        }

        await eventDoc.ensureNumericId();
        await ensureRelatedIds(relatedIncident);

        const timelineType = INCIDENT_EVENT_TYPE_MAP[eventDoc.eventType];
        if (!timelineType) {
            continue;
        }

        if (timelineType === 'incident_resolved') {
            resolutionIncidentIds.add(relatedIncident.id);
        }

        items.push(makeEvent({
            id: `incident-event-${eventDoc.id}`,
            timestamp: eventDoc.createdAt,
            type: timelineType,
            title: relatedIncident.title,
            description: eventDoc.message,
            serviceId: relatedIncident.service_id,
            incidentId: relatedIncident.id,
            severity: mapSeverity(relatedIncident.severity)
        }));

        if (timelineType === 'incident_resolved') {
            if (!serviceHasOtherActiveIncidents(activeByService, relatedIncident.service_id, relatedIncident.id)) {
                items.push(makeEvent({
                    id: `service-recovered-event-${eventDoc.id}`,
                    timestamp: eventDoc.createdAt,
                    type: 'service_recovered',
                    title: 'Service recovered',
                    description: `Service restored after incident #${relatedIncident.id} was resolved.`,
                    serviceId: relatedIncident.service_id,
                    incidentId: relatedIncident.id,
                    severity: 'info'
                }));
            }
        }
    }

    return { items, resolutionIncidentIds };
}

async function collectIncidentLifecycleItems({ cutoff, service, incident, resolutionIncidentIds }) {
    const incidentQuery = {};

    if (service) {
        incidentQuery.service_id = service.id;
    }
    if (incident) {
        incidentQuery.id = incident.id;
    }
    if (cutoff) {
        incidentQuery.createdAt = { $gte: cutoff };
    }

    const incidents = await Incident.find(incidentQuery);
    const items = [];
    const serviceIds = incidents.map((doc) => doc.service_id).filter((id) => typeof id === 'number');
    const activeByService = await loadActiveIncidentIdsByService(serviceIds);

    for (const incidentDoc of incidents) {
        await ensureRelatedIds(incidentDoc);

        const severity = mapSeverity(incidentDoc.severity);
        const description = incidentDoc.description || `Incident #${incidentDoc.id} opened.`;

        items.push(makeEvent({
            id: `incident-created-${incidentDoc.id}`,
            timestamp: incidentDoc.createdAt,
            type: 'incident_created',
            title: incidentDoc.title,
            description,
            serviceId: incidentDoc.service_id,
            incidentId: incidentDoc.id,
            severity
        }));

        if (incidentDoc.status !== 'resolved') {
            items.push(makeEvent({
                id: `service-degraded-${incidentDoc.id}`,
                timestamp: incidentDoc.createdAt,
                type: 'service_degraded',
                title: `${incidentDoc.title} — service impact`,
                description: `Service health affected by active ${incidentDoc.severity} incident.`,
                serviceId: incidentDoc.service_id,
                incidentId: incidentDoc.id,
                severity
            }));
        }

        const resolvedAt = toDate(incidentDoc.resolvedAt);
        if (resolvedAt && !resolutionIncidentIds.has(incidentDoc.id)) {
            items.push(makeEvent({
                id: `incident-resolved-${incidentDoc.id}`,
                timestamp: resolvedAt,
                type: 'incident_resolved',
                title: incidentDoc.title,
                description: `Incident #${incidentDoc.id} resolved.`,
                serviceId: incidentDoc.service_id,
                incidentId: incidentDoc.id,
                severity
            }));

            if (!serviceHasOtherActiveIncidents(activeByService, incidentDoc.service_id, incidentDoc.id)) {
                items.push(makeEvent({
                    id: `service-recovered-${incidentDoc.id}`,
                    timestamp: resolvedAt,
                    type: 'service_recovered',
                    title: 'Service recovered',
                    description: `Service restored after incident #${incidentDoc.id} was resolved.`,
                    serviceId: incidentDoc.service_id,
                    incidentId: incidentDoc.id,
                    severity: 'info'
                }));
            }
        }
    }

    return items;
}

async function collectAlertItems({ cutoff, service, incident, alertId }) {
    const alerts = await getTimelineAlerts({
        service_id: service?.id,
        incident_id: incident?.id,
        alert_id: alertId,
        created_after: cutoff ? cutoff.toISOString() : undefined
    });

    const items = [];

    for (const alert of alerts) {
        const severity = mapSeverity(alert.severity);
        const description = alert.description || `Alert #${alert.id} triggered.`;

        items.push(makeEvent({
            id: `alert-triggered-${alert.id}`,
            timestamp: alert.created_at,
            type: 'alert_triggered',
            title: alert.name,
            description,
            serviceId: alert.service_id,
            incidentId: alert.incident_id,
            alertId: alert.id,
            severity
        }));

        if (
            (alert.status === 'acknowledged' || alert.status === 'resolved') &&
            alert.updated_at &&
            alert.created_at &&
            new Date(alert.updated_at).getTime() > new Date(alert.created_at).getTime()
        ) {
            items.push(makeEvent({
                id: `alert-acknowledged-${alert.id}`,
                timestamp: alert.updated_at,
                type: 'alert_acknowledged',
                title: alert.name,
                description: `Alert #${alert.id} acknowledged.`,
                serviceId: alert.service_id,
                incidentId: alert.incident_id,
                alertId: alert.id,
                severity
            }));
        }
    }

    return items;
}
const getTimeline = async (req, res) => {
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

        if (req.query.type !== undefined && req.query.type !== '') {
            if (!TIMELINE_TYPES.includes(req.query.type)) {
                return res.status(400).json({ message: 'Invalid type' });
            }
        }

        if (req.query.period !== undefined && req.query.period !== '') {
            if (!TIMELINE_PERIODS.includes(req.query.period)) {
                return res.status(400).json({ message: 'Invalid period' });
            }
        }

        const serviceIdResult = parseNumericId(req.query.service_id);
        if (!serviceIdResult.missing && serviceIdResult.error) {
            return res.status(400).json({ message: 'Invalid service_id' });
        }

        const incidentIdResult = parseNumericId(req.query.incident_id);
        if (!incidentIdResult.missing && incidentIdResult.error) {
            return res.status(400).json({ message: 'Invalid incident_id' });
        }

        const alertIdResult = parseNumericId(req.query.alert_id);
        if (!alertIdResult.missing && alertIdResult.error) {
            return res.status(400).json({ message: 'Invalid alert_id' });
        }

        let service = null;
        if (!serviceIdResult.missing) {
            service = await Service.findOne({ id: serviceIdResult.id }).select('id');
            if (!service) {
                return res.status(200).json(emptyPage(page, pageSize));
            }
            await service.ensureNumericId();
        }

        let incident = null;
        if (!incidentIdResult.missing) {
            incident = await Incident.findOne({ id: incidentIdResult.id }).select('id service_id');
            if (incident && service && incident.service_id !== service.id) {
                incident = null;
            }
            if (!incident) {
                return res.status(200).json(emptyPage(page, pageSize));
            }
        }

        const cutoff = periodStart(req.query.period);
        const typeFilter = req.query.type || null;
        const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
        const alertId = alertIdResult.missing ? null : alertIdResult.id;
        const skipIncidentSources = alertId !== null;

        const [incidentEventResult, alertItems] = await Promise.all([
            skipIncidentSources
                ? { items: [], resolutionIncidentIds: new Set() }
                : collectIncidentEventItems({ cutoff, service, incident }),
            collectAlertItems({ cutoff, service, incident, alertId })
        ]);

        const lifecycle = skipIncidentSources
            ? []
            : await collectIncidentLifecycleItems({
                cutoff,
                service,
                incident,
                resolutionIncidentIds: incidentEventResult.resolutionIncidentIds
            });

        const events = [
            ...incidentEventResult.items,
            ...lifecycle,
            ...alertItems
        ].filter((event) => {
            if (!event.timestamp) {
                return false;
            }

            if (typeFilter && event.type !== typeFilter) {
                return false;
            }

            if (cutoff && new Date(event.timestamp) < cutoff) {
                return false;
            }

            if (search) {
                const haystack = `${event.title} ${event.description}`.toLowerCase();
                if (!haystack.includes(search)) {
                    return false;
                }
            }

            return true;
        });

        events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const stats = computeStats(events);
        const total = events.length;
        const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
        const skip = (page - 1) * pageSize;
        const items = events.slice(skip, skip + pageSize);

        res.status(200).json({
            items,
            page,
            page_size: pageSize,
            total,
            total_pages: totalPages,
            stats
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

export { getTimeline };
