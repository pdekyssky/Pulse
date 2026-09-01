import Incident, { INCIDENT_STATUSES, INCIDENT_SEVERITIES } from '../models/Incidents.js';
import Service from '../models/Service.js';
import { getReportAlerts } from '../clients/alertServiceClient.js';
import { getUsersByIds } from '../clients/userServiceClient.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 6;

const REPORT_TYPES = [
    'incident_summary',
    'service_availability',
    'performance',
    'alert_summary',
    'monthly_operations'
];

const REPORT_STATUSES = ['completed', 'generating', 'scheduled', 'failed'];

const REPORT_PERIODS = ['all', 'last_7_days', 'last_30_days', 'last_90_days'];

const REPORT_PERIOD_DAYS = {
    last_7_days: 7,
    last_30_days: 30,
    last_90_days: 90
};

const REPORT_TYPE_LABELS = {
    incident_summary: 'Incident Summary',
    service_availability: 'Service Availability',
    performance: 'Performance Report',
    alert_summary: 'Alert Summary',
    monthly_operations: 'Monthly Operations Report'
};

const STATUS_RESPONSE_TIME_MS = {
    operational: 45,
    degraded: 80,
    down: 150
};

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

function utcDayStart(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(day, days) {
    const next = new Date(day);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
}

function periodBounds(days) {
    const endDay = utcDayStart(new Date());
    const startDay = addUtcDays(endDay, -(days - 1));
    const rangeStart = startDay;
    const rangeEnd = addUtcDays(endDay, 1);
    const periodStart = startDay;
    const periodEnd = new Date(Date.UTC(
        endDay.getUTCFullYear(),
        endDay.getUTCMonth(),
        endDay.getUTCDate(),
        23,
        59,
        59,
        999
    ));

    return { rangeStart, rangeEnd, periodStart, periodEnd, startDay, endDay };
}

function iterDates(startDay, endDay) {
    const days = [];
    let current = startDay;

    while (current <= endDay) {
        days.push(new Date(current));
        current = addUtcDays(current, 1);
    }

    return days;
}

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

function inRange(value, start, end) {
    if (!value) {
        return false;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return false;
    }

    return date >= start && date < end;
}

function inDayWindow(value, day) {
    return inRange(value, day, addUtcDays(day, 1));
}

function numericUptime(service) {
    if (typeof service.uptime === 'number' && Number.isFinite(service.uptime)) {
        return service.uptime;
    }

    return 0;
}

function averageServiceUptime(services) {
    if (services.length === 0) {
        return 100;
    }

    const sum = services.reduce((total, service) => total + numericUptime(service), 0);
    return sum / services.length;
}

function formatUptime(value) {
    return `${value.toFixed(2)}%`;
}

function formatResponseTime(value) {
    return `${Math.round(value)} ms`;
}

function formatMttr(totalSeconds) {
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
        return '0m';
    }

    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

function computeMttr(resolvedIncidents) {
    const eligible = resolvedIncidents.filter((incident) => incident.status === 'resolved' && incident.resolvedAt);

    if (eligible.length === 0) {
        return '0m';
    }

    let totalSeconds = 0;

    for (const incident of eligible) {
        const startedAt = incident.startedAt || incident.createdAt;
        if (!startedAt) {
            continue;
        }

        totalSeconds += (new Date(incident.resolvedAt) - new Date(startedAt)) / 1000;
    }

    return formatMttr(totalSeconds / eligible.length);
}

function estimateDailyResponseTime(incidents, day) {
    let spike = 0;

    for (const incident of incidents) {
        if (!inDayWindow(incident.createdAt, day)) {
            continue;
        }

        if (incident.severity === 'critical') {
            spike += 50;
        } else if (incident.severity === 'high') {
            spike += 30;
        } else {
            spike += 10;
        }
    }

    return 45 + spike;
}

function sameService(doc, service) {
    if (!service) {
        return true;
    }

    return doc.service_id === service.id;
}

function filterByService(docs, service) {
    if (!service) {
        return docs;
    }

    return docs.filter((doc) => sameService(doc, service));
}

function daysToAnalyticsRange(days) {
    if (days <= 7) {
        return 7;
    }

    if (days <= 14) {
        return 14;
    }

    return 30;
}

function incidentCounts(incidents) {
    let active = 0;
    let resolved = 0;

    for (const incident of incidents) {
        if (incident.status === 'resolved') {
            resolved += 1;
        } else {
            active += 1;
        }
    }

    return {
        total: incidents.length,
        active,
        resolved
    };
}

function alertCounts(alerts) {
    let critical = 0;
    let acknowledged = 0;
    let resolved = 0;

    for (const alert of alerts) {
        if (alert.severity === 'critical') {
            critical += 1;
        }
        if (alert.status === 'acknowledged') {
            acknowledged += 1;
        }
        if (alert.status === 'resolved') {
            resolved += 1;
        }
    }

    return {
        total: alerts.length,
        critical,
        acknowledged,
        resolved
    };
}

function buildServicePerformance(services, incidents) {
    const counts = new Map();

    for (const incident of incidents) {
        const key = incident.service_id;
        counts.set(key, (counts.get(key) || 0) + 1);
    }

    return services.map((service) => ({
        service_id: service.id,
        service_name: service.name,
        uptime: numericUptime(service),
        response_time: STATUS_RESPONSE_TIME_MS[service.status] ?? 45,
        incident_count: counts.get(service.id) || 0
    }));
}

function analyticsSnapshot(days, services, createdIncidents, resolvedIncidents, alerts) {
    const bounds = periodBounds(days);
    const dates = iterDates(bounds.startDay, bounds.endDay);
    const created = createdIncidents.filter((incident) => inRange(incident.createdAt, bounds.rangeStart, bounds.rangeEnd));
    const resolved = resolvedIncidents.filter((incident) => inRange(incident.resolvedAt, bounds.rangeStart, bounds.rangeEnd));
    const windowAlerts = alerts.filter((alert) => inRange(alert.createdAt, bounds.rangeStart, bounds.rangeEnd));
    const responseSeries = dates.map((day) => estimateDailyResponseTime(created, day));
    const averageResponseTime = responseSeries.length > 0
        ? responseSeries.reduce((sum, value) => sum + value, 0) / responseSeries.length
        : 45;

    return {
        kpis: {
            overall_uptime: formatUptime(averageServiceUptime(services)),
            average_response_time: formatResponseTime(averageResponseTime),
            total_incidents: created.length,
            mttr: computeMttr(resolved),
            alert_volume: windowAlerts.length
        },
        service_performance: buildServicePerformance(services, created)
    };
}

function metric(label, value) {
    return { label, value: String(value) };
}

function makeReport({
    id,
    name,
    type,
    periodStart,
    periodEnd,
    generatedById,
    summary,
    scope,
    serviceIds,
    metrics,
    description = null
}) {
    return {
        id,
        name,
        type,
        period_start: toIso(periodStart),
        period_end: toIso(periodEnd),
        created_at: toIso(periodEnd),
        status: 'completed',
        generated_by_id: generatedById,
        description,
        summary,
        scope,
        service_ids: serviceIds,
        metrics,
        scheduled_for: null
    };
}

function serviceSuffix(service) {
    return service ? ` - ${service.name}` : '';
}

function serviceScope(service) {
    return service ? service.name : 'All services';
}

function serviceIds(service) {
    return service ? [service.id] : null;
}

function reportId(type, days, service) {
    return `${type}-${days}d-${service ? service.id : 'all'}`;
}

function buildIncidentSummary({ days, service, generatedById, periodStart, periodEnd, incidents, analytics }) {
    const counts = incidentCounts(incidents);

    return makeReport({
        id: reportId('incident_summary', days, service),
        name: `Last ${days} Days ${REPORT_TYPE_LABELS.incident_summary}${serviceSuffix(service)}`,
        type: 'incident_summary',
        periodStart,
        periodEnd,
        generatedById,
        summary: `${counts.total} incident(s) recorded during the reporting period. ${counts.resolved} resolved and ${counts.active} remain active.`,
        scope: serviceScope(service),
        serviceIds: serviceIds(service),
        metrics: [
            metric('Total Incidents', counts.total),
            metric('Resolved', counts.resolved),
            metric('Active', counts.active),
            metric('Mean Time to Resolve', analytics.kpis.mttr)
        ]
    });
}

function buildServiceAvailability({ days, service, generatedById, periodStart, periodEnd, services, analytics }) {
    const scopedServices = service ? [service] : services;
    const degradedEvents = scopedServices.filter((item) => item.status === 'degraded').length;
    const outageEvents = scopedServices.filter((item) => item.status === 'down').length;

    return makeReport({
        id: reportId('service_availability', days, service),
        name: `Last ${days} Days Service Availability${serviceSuffix(service)}`,
        type: 'service_availability',
        periodStart,
        periodEnd,
        generatedById,
        summary: `Platform uptime averaged ${analytics.kpis.overall_uptime} across ${scopedServices.length} monitored service(s).`,
        scope: serviceScope(service),
        serviceIds: serviceIds(service),
        metrics: [
            metric('Average Uptime', analytics.kpis.overall_uptime),
            metric('Services Monitored', scopedServices.length),
            metric('Degraded Events', degradedEvents),
            metric('Outage Events', outageEvents)
        ]
    });
}

function buildPerformance({ days, service, generatedById, periodStart, periodEnd, analytics }) {
    const rows = analytics.service_performance;
    let slowestLabel = 'N/A';
    let fastestLabel = 'N/A';

    if (rows.length > 0) {
        slowestLabel = rows.reduce((current, row) => (row.response_time > current.response_time ? row : current)).service_name;
        fastestLabel = rows.reduce((current, row) => (row.response_time < current.response_time ? row : current)).service_name;
    }

    return makeReport({
        id: reportId('performance', days, service),
        name: `Last ${days} Days Performance Report${serviceSuffix(service)}`,
        type: 'performance',
        periodStart,
        periodEnd,
        generatedById,
        summary: `Average response time was ${analytics.kpis.average_response_time} over the selected period.`,
        scope: serviceScope(service),
        serviceIds: serviceIds(service),
        metrics: [
            metric('Avg Response Time', analytics.kpis.average_response_time),
            metric('Slowest Service', slowestLabel),
            metric('Fastest Service', fastestLabel),
            metric('Services Analyzed', rows.length)
        ]
    });
}

function buildAlertSummary({ days, service, generatedById, periodStart, periodEnd, alerts }) {
    const counts = alertCounts(alerts);

    return makeReport({
        id: reportId('alert_summary', days, service),
        name: `Last ${days} Days Alert Summary${serviceSuffix(service)}`,
        type: 'alert_summary',
        periodStart,
        periodEnd,
        generatedById,
        summary: `${counts.total} alert(s) were recorded during the reporting period.`,
        scope: serviceScope(service),
        serviceIds: serviceIds(service),
        metrics: [
            metric('Total Alerts', counts.total),
            metric('Critical', counts.critical),
            metric('Acknowledged', counts.acknowledged),
            metric('Resolved', counts.resolved)
        ]
    });
}

function buildMonthlyOperations({ days, generatedById, periodStart, periodEnd, services, analytics }) {
    return makeReport({
        id: reportId('monthly_operations', days, null),
        name: `Last ${days} Days Operations Report`,
        type: 'monthly_operations',
        periodStart,
        periodEnd,
        generatedById,
        summary: 'Operations review covering incidents, service health, and alert activity for the selected period.',
        scope: 'All services',
        serviceIds: null,
        metrics: [
            metric('Incidents', analytics.kpis.total_incidents),
            metric('Avg Uptime', analytics.kpis.overall_uptime),
            metric('Alerts Fired', analytics.kpis.alert_volume),
            metric('Services Monitored', services.length)
        ]
    });
}

async function resolveGeneratedById() {
    const admin = await User.findOne({ role: 'admin', id: { $type: 'number' } })
        .select('id')
        .sort({ id: 1 });

    if (admin && typeof admin.id === 'number') {
        return admin.id;
    }

    const fallback = await User.findOne({ id: { $type: 'number' } })
        .select('id')
        .sort({ id: 1 });

    if (fallback && typeof fallback.id === 'number') {
        return fallback.id;
    }

    return 1;
}

async function generateAllReports(generatedById) {
    const bounds90 = periodBounds(90);
    const [
        services,
        createdIncidents,
        resolvedIncidents,
        alerts
    ] = await Promise.all([
        Service.find().select('id name status uptime').sort({ name: 1 }),
        Incident.find({
            createdAt: { $gte: bounds90.rangeStart, $lt: bounds90.rangeEnd }
        }).select('status severity service_id createdAt startedAt resolvedAt'),
        Incident.find({
            resolvedAt: { $ne: null, $gte: bounds90.rangeStart, $lt: bounds90.rangeEnd }
        }).select('status startedAt createdAt resolvedAt service_id'),
        getReportAlerts({ created_after: bounds90.rangeStart.toISOString() })
    ]);

    const normalizedAlerts = (Array.isArray(alerts) ? alerts : []).map((alert) => ({
        ...alert,
        createdAt: alert.createdAt || alert.created_at,
        service_id: alert.service_id
    }));

    for (const service of services) {
        await service.ensureNumericId();
    }

    const snapshotCache = new Map();

    function snapshotFor(days, service) {
        const analyticsDays = daysToAnalyticsRange(days);
        const key = `${analyticsDays}:${service ? service.id : 'all'}`;

        if (!snapshotCache.has(key)) {
            const scopedServices = service ? [service] : services;
            snapshotCache.set(key, analyticsSnapshot(
                analyticsDays,
                scopedServices,
                filterByService(createdIncidents, service),
                filterByService(resolvedIncidents, service),
                filterByService(normalizedAlerts, service)
            ));
        }

        return snapshotCache.get(key);
    }

    function windowDocs(docs, days, field, service) {
        const bounds = periodBounds(days);
        return filterByService(docs, service).filter((doc) => inRange(doc[field], bounds.rangeStart, bounds.rangeEnd));
    }

    const reports = [];

    for (const days of [7, 30, 90]) {
        const { periodStart, periodEnd } = periodBounds(days);
        const analytics = snapshotFor(days, null);
        const context = {
            days,
            service: null,
            generatedById,
            periodStart,
            periodEnd,
            incidents: windowDocs(createdIncidents, days, 'createdAt', null),
            alerts: windowDocs(normalizedAlerts, days, 'createdAt', null),
            services,
            analytics
        };

        reports.push(buildIncidentSummary(context));
        reports.push(buildServiceAvailability(context));
        reports.push(buildAlertSummary(context));

        if (days === 30 || days === 90) {
            reports.push(buildMonthlyOperations(context));
        }
    }

    for (const days of [7, 30]) {
        const { periodStart, periodEnd } = periodBounds(days);
        reports.push(buildPerformance({
            days,
            service: null,
            generatedById,
            periodStart,
            periodEnd,
            analytics: snapshotFor(days, null)
        }));
    }

    for (const service of services) {
        const { periodStart, periodEnd } = periodBounds(7);
        const analytics = snapshotFor(7, service);
        const context = {
            days: 7,
            service,
            generatedById,
            periodStart,
            periodEnd,
            incidents: windowDocs(createdIncidents, 7, 'createdAt', service),
            alerts: windowDocs(normalizedAlerts, 7, 'createdAt', service),
            services,
            analytics
        };

        reports.push(buildServiceAvailability(context));
        reports.push(buildPerformance(context));
    }

    reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return reports;
}

function matchesSearch(report, search) {
    if (!search) {
        return true;
    }

    const haystack = `${report.name} ${report.summary} ${report.scope}`.toLowerCase();
    return haystack.includes(search);
}

function matchesPeriod(report, period) {
    if (!period || period === 'all') {
        return true;
    }

    const days = REPORT_PERIOD_DAYS[period];
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return new Date(report.created_at) >= cutoff;
}

function computeStats(reports) {
    return {
        total: reports.length,
        incident_reports: reports.filter((report) => report.type === 'incident_summary').length,
        service_reports: reports.filter((report) => (
            report.type === 'service_availability' || report.type === 'performance'
        )).length,
        scheduled: reports.filter((report) => report.status === 'scheduled').length
    };
}

const listReports = async (req, res) => {
    try {
        const pageResult = parsePositiveInt(req.query.page, DEFAULT_PAGE);
        const pageSizeResult = parsePositiveInt(req.query.page_size, DEFAULT_PAGE_SIZE);

        if (pageResult.error) {
            return res.status(400).json({ message: 'Invalid page' });
        }

        if (pageSizeResult.error) {
            return res.status(400).json({ message: 'Invalid page_size' });
        }

        if (req.query.type !== undefined && req.query.type !== '') {
            if (!REPORT_TYPES.includes(req.query.type)) {
                return res.status(400).json({ message: 'Invalid type' });
            }
        }

        if (req.query.status !== undefined && req.query.status !== '') {
            if (!REPORT_STATUSES.includes(req.query.status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }
        }

        if (req.query.period !== undefined && req.query.period !== '') {
            if (!REPORT_PERIODS.includes(req.query.period)) {
                return res.status(400).json({ message: 'Invalid period' });
            }
        }

        const page = pageResult.value;
        const pageSize = pageSizeResult.value;
        const typeFilter = req.query.type || null;
        const statusFilter = req.query.status || null;
        const periodFilter = req.query.period || 'all';
        const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

        const reports = await generateAllReports(req.userId || 1);
        const filtered = reports.filter((report) => {
            if (typeFilter && report.type !== typeFilter) {
                return false;
            }

            if (statusFilter && report.status !== statusFilter) {
                return false;
            }

            if (!matchesSearch(report, search)) {
                return false;
            }

            if (!matchesPeriod(report, periodFilter)) {
                return false;
            }

            return true;
        });

        filtered.sort((a, b) => {
            const aRank = a.status === 'generating' ? 0 : 1;
            const bRank = b.status === 'generating' ? 0 : 1;

            if (aRank !== bRank) {
                return bRank - aRank;
            }

            return new Date(b.created_at) - new Date(a.created_at);
        });

        const stats = computeStats(filtered);
        const total = filtered.length;
        const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
        const skip = (page - 1) * pageSize;
        const items = filtered.slice(skip, skip + pageSize);

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

const getReportById = async (req, res) => {
    try {
        const reportIdParam = req.params.id;

        if (!reportIdParam || typeof reportIdParam !== 'string') {
            return res.status(400).json({ message: 'Invalid report ID' });
        }

        const reports = await generateAllReports(req.userId || 1);
        const report = reports.find((item) => item.id === reportIdParam);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

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

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function numericRefId(doc) {
    if (doc && typeof doc === 'object' && typeof doc.id === 'number') {
        return doc.id;
    }

    return null;
}

const listIncidentReports = async (req, res) => {
    try {
        const pageResult = parsePositiveInt(req.query.page, DEFAULT_PAGE);
        const pageSizeResult = parsePositiveInt(req.query.page_size, DEFAULT_PAGE_SIZE);

        if (pageResult.error) {
            return res.status(400).json({ message: 'Invalid page' });
        }

        if (pageSizeResult.error) {
            return res.status(400).json({ message: 'Invalid page_size' });
        }

        if (req.query.status !== undefined && req.query.status !== '' && !INCIDENT_STATUSES.includes(req.query.status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        if (req.query.severity !== undefined && req.query.severity !== '' && !INCIDENT_SEVERITIES.includes(req.query.severity)) {
            return res.status(400).json({ message: 'Invalid severity' });
        }

        if (req.query.period !== undefined && req.query.period !== '' && !REPORT_PERIODS.includes(req.query.period)) {
            return res.status(400).json({ message: 'Invalid period' });
        }

        const filter = {};

        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.severity) {
            filter.severity = req.query.severity;
        }

        if (req.query.service_id !== undefined && req.query.service_id !== '') {
            const parsed = parseNumericId(req.query.service_id);
            if (parsed.missing || parsed.error) {
                return res.status(400).json({ message: 'Invalid service_id' });
            }

            const service = await Service.findOne({ id: parsed.id }).select('id');
            if (!service) {
                return res.status(200).json({
                    items: [],
                    page: pageResult.value,
                    page_size: pageSizeResult.value,
                    total: 0,
                    total_pages: 0,
                    stats: { total: 0, open: 0, resolved: 0 }
                });
            }
            filter.service_id = service.id;
        }

        if (req.query.period && req.query.period !== 'all') {
            const periodDays = REPORT_PERIOD_DAYS[req.query.period];
            const { rangeStart } = periodBounds(periodDays);
            filter.createdAt = { $gte: rangeStart };
        }

        if (req.query.search !== undefined && String(req.query.search).trim().length > 0) {
            const search = String(req.query.search).trim();
            const incMatch = search.match(/^inc-(\d+)$/i);
            const searchClauses = [];

            if (incMatch) {
                searchClauses.push({ id: Number(incMatch[1]) });
            } else if (/^\d+$/.test(search)) {
                searchClauses.push({ id: Number(search) });
            }

            const regex = new RegExp(escapeRegex(search), 'i');
            searchClauses.push({ title: regex });
            filter.$or = searchClauses;
        }

        const page = pageResult.value;
        const pageSize = pageSizeResult.value;
        const total = await Incident.countDocuments(filter);
        const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
        const skip = (page - 1) * pageSize;

        let open;
        let resolved;
        if (filter.status === 'resolved') {
            open = 0;
            resolved = total;
        } else if (filter.status) {
            open = total;
            resolved = 0;
        } else {
            [open, resolved] = await Promise.all([
                Incident.countDocuments({ ...filter, status: { $ne: 'resolved' } }),
                Incident.countDocuments({ ...filter, status: 'resolved' })
            ]);
        }

        const incidents = await Incident.find(filter)
            .sort({ createdAt: -1, id: -1 })
            .skip(skip)
            .limit(pageSize);

        for (const incident of incidents) {
            await incident.ensureNumericId();
        }

        const assigneeIds = [...new Set(incidents.map((incident) => incident.assigned_to_id).filter((id) => typeof id === 'number'))];
        const serviceIds = [...new Set(incidents.map((incident) => incident.service_id).filter((id) => typeof id === 'number'))];
        const [users, services] = await Promise.all([
            getUsersByIds(assigneeIds, { userId: req.userId, userRole: req.userRole, userName: req.userName }),
            Service.find({ id: { $in: serviceIds } }).select('id name')
        ]);
        const userList = Array.isArray(users) ? users : (users.items || []);
        const userById = new Map(userList.map((user) => [user.id, user]));
        const serviceById = new Map(services.map((service) => [service.id, service]));

        res.status(200).json({
            items: incidents.map((incident) => ({
                id: incident.id,
                title: incident.title,
                severity: incident.severity,
                status: incident.status,
                service_id: incident.service_id ?? null,
                service_name: serviceById.get(incident.service_id)?.name ?? null,
                assigned_to_id: incident.assigned_to_id ?? null,
                assigned_to_name: userById.get(incident.assigned_to_id)?.name ?? null,
                created_at: toIso(incident.createdAt),
                resolved_at: toIso(incident.resolvedAt)
            })),
            page,
            page_size: pageSize,
            total,
            total_pages: totalPages,
            stats: {
                total,
                open,
                resolved
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

export { listReports, getReportById, listIncidentReports };
