import Incident from '../models/Incidents.js';
import Service from '../models/Service.js';
import Alert from '../models/Alert.js';

const DATE_RANGE_DAYS = {
    '7d': 7,
    '14d': 14,
    '30d': 30
};

const DATE_RANGES = Object.keys(DATE_RANGE_DAYS);

const STATUS_RESPONSE_TIME_MS = {
    operational: 45,
    degraded: 80,
    down: 150
};

const SEVERITY_UPTIME_PENALTY = {
    critical: 1.5,
    high: 1,
    medium: 0.5,
    low: 0.2
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

function utcDayStart(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(day, days) {
    const next = new Date(day);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
}

function dateBounds(days) {
    const end = utcDayStart(new Date());
    const start = addUtcDays(end, -(days - 1));
    return { startDay: start, endDay: end };
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

function isoDate(day) {
    const year = day.getUTCFullYear();
    const month = String(day.getUTCMonth() + 1).padStart(2, '0');
    const date = String(day.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
}

function formatDateLabel(day) {
    const date = String(day.getUTCDate()).padStart(2, '0');
    return `${MONTH_LABELS[day.getUTCMonth()]} ${date}`;
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

function inDayWindow(value, day) {
    const timestamp = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(timestamp.getTime())) {
        return false;
    }

    const start = day;
    const end = addUtcDays(day, 1);
    return timestamp >= start && timestamp < end;
}

function estimateDailyUptime(baseUptime, incidents, day) {
    let penalty = 0;

    for (const incident of incidents) {
        if (!inDayWindow(incident.createdAt, day)) {
            continue;
        }

        penalty += SEVERITY_UPTIME_PENALTY[incident.severity] ?? 0.3;
    }

    return Math.max(90, Math.min(100, baseUptime - penalty));
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

function buildUptimeSeries(services, incidents, dates) {
    if (services.length === 0) {
        return dates.map((day) => ({
            date: isoDate(day),
            label: formatDateLabel(day),
            uptime: 100
        }));
    }

    const baseUptime = averageServiceUptime(services);

    return dates.map((day) => ({
        date: isoDate(day),
        label: formatDateLabel(day),
        uptime: Number(estimateDailyUptime(baseUptime, incidents, day).toFixed(2))
    }));
}

function buildIncidentTrend(createdIncidents, resolvedIncidents, dates) {
    return dates.map((day) => {
        let total = 0;
        let critical = 0;
        let resolved = 0;

        for (const incident of createdIncidents) {
            if (!inDayWindow(incident.createdAt, day)) {
                continue;
            }

            total += 1;
            if (incident.severity === 'critical') {
                critical += 1;
            }
        }

        for (const incident of resolvedIncidents) {
            if (inDayWindow(incident.resolvedAt, day)) {
                resolved += 1;
            }
        }

        return {
            date: isoDate(day),
            label: formatDateLabel(day),
            total,
            critical,
            resolved
        };
    });
}

function buildResponseTimeSeries(incidents, dates) {
    return dates.map((day) => ({
        date: isoDate(day),
        label: formatDateLabel(day),
        response_time: Number(estimateDailyResponseTime(incidents, day).toFixed(1))
    }));
}

function buildServicePerformance(services, incidents) {
    const counts = new Map();

    for (const incident of incidents) {
        const key = String(incident.service);
        counts.set(key, (counts.get(key) || 0) + 1);
    }

    const rows = services.map((service) => ({
        service_id: service.id,
        service_name: service.name,
        uptime: numericUptime(service),
        response_time: STATUS_RESPONSE_TIME_MS[service.status] ?? 45,
        incident_count: counts.get(String(service._id)) || 0
    }));

    rows.sort((a, b) => b.uptime - a.uptime);
    return rows;
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

const getAnalyticsOverview = async (req, res) => {
    try {
        let dateRange = '7d';

        if (req.query.date_range !== undefined) {
            if (!DATE_RANGES.includes(req.query.date_range)) {
                return res.status(400).json({ message: 'Invalid date_range' });
            }
            dateRange = req.query.date_range;
        }

        const serviceIdResult = parseNumericId(req.query.service_id);
        if (!serviceIdResult.missing && serviceIdResult.error) {
            return res.status(400).json({ message: 'Invalid service_id' });
        }

        let service = null;
        if (!serviceIdResult.missing) {
            service = await Service.findOne({ id: serviceIdResult.id }).select('_id id name status uptime');
            if (service) {
                await service.ensureNumericId();
            }
        }

        const days = DATE_RANGE_DAYS[dateRange];
        const { startDay, endDay } = dateBounds(days);
        const dates = iterDates(startDay, endDay);
        const rangeStart = startDay;
        const rangeEnd = addUtcDays(endDay, 1);
        const requestedServiceId = serviceIdResult.missing ? null : serviceIdResult.id;

        if (!serviceIdResult.missing && !service) {
            const emptySeries = buildUptimeSeries([], [], dates);
            const emptyTrend = buildIncidentTrend([], [], dates);
            const emptyResponse = buildResponseTimeSeries([], dates);

            return res.status(200).json({
                date_range: dateRange,
                service_id: requestedServiceId,
                kpis: {
                    overall_uptime: formatUptime(100),
                    average_response_time: formatResponseTime(
                        emptyResponse.reduce((sum, point) => sum + point.response_time, 0) / emptyResponse.length
                    ),
                    total_incidents: 0,
                    mttr: '0m',
                    alert_volume: 0
                },
                uptime_series: emptySeries,
                incident_trend: emptyTrend,
                response_time_series: emptyResponse,
                service_performance: []
            });
        }

        const serviceFilter = service ? { service: service._id } : {};
        const serviceQuery = service ? { _id: service._id } : {};

        const [services, createdIncidents, resolvedIncidents, alertVolume] = await Promise.all([
            Service.find(serviceQuery).select('id name status uptime').sort({ name: 1 }),
            Incident.find({
                createdAt: { $gte: rangeStart, $lt: rangeEnd },
                ...serviceFilter
            }).select('severity createdAt service'),
            Incident.find({
                resolvedAt: { $ne: null, $gte: rangeStart, $lt: rangeEnd },
                ...serviceFilter
            }).select('status startedAt createdAt resolvedAt'),
            Alert.countDocuments({
                createdAt: { $gte: rangeStart, $lt: rangeEnd },
                ...serviceFilter
            })
        ]);

        for (const item of services) {
            await item.ensureNumericId();
        }

        const uptimeSeries = buildUptimeSeries(services, createdIncidents, dates);
        const incidentTrend = buildIncidentTrend(createdIncidents, resolvedIncidents, dates);
        const responseTimeSeries = buildResponseTimeSeries(createdIncidents, dates);
        const servicePerformance = buildServicePerformance(services, createdIncidents);

        const overallUptime = averageServiceUptime(services);
        const averageResponseTime = responseTimeSeries.length > 0
            ? responseTimeSeries.reduce((sum, point) => sum + point.response_time, 0) / responseTimeSeries.length
            : 45;

        res.status(200).json({
            date_range: dateRange,
            service_id: requestedServiceId,
            kpis: {
                overall_uptime: formatUptime(overallUptime),
                average_response_time: formatResponseTime(averageResponseTime),
                total_incidents: createdIncidents.length,
                mttr: computeMttr(resolvedIncidents),
                alert_volume: alertVolume
            },
            uptime_series: uptimeSeries,
            incident_trend: incidentTrend,
            response_time_series: responseTimeSeries,
            service_performance: servicePerformance
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

export { getAnalyticsOverview };
