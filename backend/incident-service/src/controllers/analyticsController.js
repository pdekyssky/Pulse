import Incident, { INCIDENT_STATUSES, INCIDENT_SEVERITIES } from '../models/Incidents.js';
import Service, { SERVICE_STATUSES } from '../models/Service.js';

const DATE_RANGE_DAYS = {
    '7d': 7,
    '14d': 14,
    '30d': 30
};

const DATE_RANGES = Object.keys(DATE_RANGE_DAYS);
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

function emptyCountMap(keys) {
    return Object.fromEntries(keys.map((key) => [key, 0]));
}

function emptyOverview(dateRange, serviceId, dates) {
    return {
        date_range: dateRange,
        service_id: serviceId,
        incidents: {
            total: 0,
            open: 0,
            resolved: 0,
            by_severity: emptyCountMap(INCIDENT_SEVERITIES),
            by_status: emptyCountMap(INCIDENT_STATUSES),
            by_service: []
        },
        services: {
            total: 0,
            operational: 0,
            degraded: 0,
            down: 0,
            items: []
        },
        average_resolution_seconds: null,
        resolved_sample_size: 0,
        incident_trend: dates.map((day) => ({
            date: isoDate(day),
            label: formatDateLabel(day),
            total: 0,
            critical: 0,
            resolved: 0
        }))
    };
}

function applyCounts(keys, buckets) {
    const counts = emptyCountMap(keys);

    for (const bucket of buckets) {
        if (bucket._id === undefined || bucket._id === null || bucket._id === '') {
            continue;
        }

        counts[bucket._id] = bucket.count;
    }

    return counts;
}

function numericRefId(doc) {
    if (doc && typeof doc === 'object' && typeof doc.id === 'number') {
        return doc.id;
    }

    return null;
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
            service = await Service.findOne({ id: serviceIdResult.id }).select('id name status uptime');
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
            return res.status(200).json(emptyOverview(dateRange, requestedServiceId, dates));
        }

        const incidentMatch = {
            createdAt: { $gte: rangeStart, $lt: rangeEnd }
        };

        if (service) {
            incidentMatch.service_id = service.id;
        }

        const serviceQuery = service ? { id: service.id } : {};

        const [services, incidentFacet, createdByDay, resolvedByDay] = await Promise.all([
            Service.find(serviceQuery).select('id name status uptime').sort({ name: 1 }),
            Incident.aggregate([
                { $match: incidentMatch },
                {
                    $facet: {
                        total: [{ $count: 'count' }],
                        open: [
                            { $match: { status: { $ne: 'resolved' } } },
                            { $count: 'count' }
                        ],
                        resolved: [
                            { $match: { status: 'resolved' } },
                            { $count: 'count' }
                        ],
                        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
                        bySeverity: [{ $group: { _id: '$severity', count: { $sum: 1 } } }],
                        byService: [{ $group: { _id: '$service_id', count: { $sum: 1 } } }],
                        resolution: [
                            {
                                $match: {
                                    status: 'resolved',
                                    resolvedAt: { $ne: null },
                                    startedAt: { $ne: null }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    avgMs: { $avg: { $subtract: ['$resolvedAt', '$startedAt'] } },
                                    count: { $sum: 1 }
                                }
                            }
                        ]
                    }
                }
            ]),
            Incident.aggregate([
                { $match: incidentMatch },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' }
                        },
                        total: { $sum: 1 },
                        critical: {
                            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
                        }
                    }
                }
            ]),
            Incident.aggregate([
                {
                    $match: {
                        resolvedAt: { $ne: null, $gte: rangeStart, $lt: rangeEnd },
                        ...(service ? { service_id: service.id } : {})
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$resolvedAt', timezone: 'UTC' }
                        },
                        resolved: { $sum: 1 }
                    }
                }
            ])
        ]);

        for (const item of services) {
            await item.ensureNumericId();
        }

        const facet = incidentFacet[0] ?? {
            total: [],
            open: [],
            resolved: [],
            byStatus: [],
            bySeverity: [],
            byService: [],
            resolution: []
        };

        const totalIncidents = facet.total[0]?.count ?? 0;
        const byStatus = applyCounts(INCIDENT_STATUSES, facet.byStatus);
        const bySeverity = applyCounts(INCIDENT_SEVERITIES, facet.bySeverity);
        const openIncidents = facet.open[0]?.count ?? 0;
        const resolvedIncidents = facet.resolved[0]?.count ?? 0;

        const serviceById = new Map(services.map((item) => [item.id, item]));
        const incidentCountByService = new Map(
            (facet.byService ?? []).map((bucket) => [bucket._id, bucket.count])
        );

        const incidentsByService = [...incidentCountByService.entries()]
            .map(([serviceId, count]) => {
                const item = serviceById.get(serviceId);
                return {
                    service_id: item ? item.id : serviceId,
                    service_name: item ? item.name : 'Unknown',
                    count
                };
            })
            .sort((a, b) => b.count - a.count);

        const serviceHealth = emptyCountMap(SERVICE_STATUSES);
        for (const item of services) {
            if (Object.prototype.hasOwnProperty.call(serviceHealth, item.status)) {
                serviceHealth[item.status] += 1;
            }
        }

        const createdMap = new Map(createdByDay.map((bucket) => [bucket._id, bucket]));
        const resolvedMap = new Map(resolvedByDay.map((bucket) => [bucket._id, bucket.resolved]));

        const incidentTrend = dates.map((day) => {
            const key = isoDate(day);
            const created = createdMap.get(key);
            return {
                date: key,
                label: formatDateLabel(day),
                total: created?.total ?? 0,
                critical: created?.critical ?? 0,
                resolved: resolvedMap.get(key) ?? 0
            };
        });

        const resolution = facet.resolution[0];
        const averageResolutionSeconds = resolution && Number.isFinite(resolution.avgMs)
            ? Number((resolution.avgMs / 1000).toFixed(1))
            : null;

        res.status(200).json({
            date_range: dateRange,
            service_id: requestedServiceId,
            incidents: {
                total: totalIncidents,
                open: openIncidents,
                resolved: resolvedIncidents,
                by_severity: bySeverity,
                by_status: byStatus,
                by_service: incidentsByService
            },
            services: {
                total: services.length,
                operational: serviceHealth.operational,
                degraded: serviceHealth.degraded,
                down: serviceHealth.down,
                items: services.map((item) => ({
                    service_id: item.id,
                    service_name: item.name,
                    status: item.status,
                    uptime: typeof item.uptime === 'number' ? item.uptime : null,
                    incident_count: incidentCountByService.get(item.id) ?? 0
                }))
            },
            average_resolution_seconds: averageResolutionSeconds,
            resolved_sample_size: resolution?.count ?? 0,
            incident_trend: incidentTrend
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

export { getAnalyticsOverview };
