import Incident, { INCIDENT_STATUSES, INCIDENT_SEVERITIES } from '../models/Incidents.js';
import Service, { SERVICE_STATUSES } from '../models/Service.js';
import Alert, { ALERT_STATUSES } from '../models/Alert.js';

const RECENT_INCIDENTS_LIMIT = 10;

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

function emptyCounts(keys) {
    return Object.fromEntries(keys.map((key) => [key, 0]));
}

function applyGroupCounts(base, rows) {
    const counts = { ...base };

    for (const row of rows) {
        if (row._id != null) {
            counts[row._id] = row.count;
        }
    }

    return counts;
}

async function countByField(Model, field) {
    const [result] = await Model.aggregate([
        {
            $facet: {
                total: [{ $count: 'count' }],
                grouped: [
                    {
                        $group: {
                            _id: `$${field}`,
                            count: { $sum: 1 }
                        }
                    }
                ]
            }
        }
    ]);

    return {
        total: result?.total?.[0]?.count ?? 0,
        grouped: result?.grouped ?? []
    };
}

async function countByTwoFields(Model, fieldA, fieldB) {
    const [result] = await Model.aggregate([
        {
            $facet: {
                total: [{ $count: 'count' }],
                groupedA: [
                    {
                        $group: {
                            _id: `$${fieldA}`,
                            count: { $sum: 1 }
                        }
                    }
                ],
                groupedB: [
                    {
                        $group: {
                            _id: `$${fieldB}`,
                            count: { $sum: 1 }
                        }
                    }
                ]
            }
        }
    ]);

    return {
        total: result?.total?.[0]?.count ?? 0,
        groupedA: result?.groupedA ?? [],
        groupedB: result?.groupedB ?? []
    };
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

const getDashboardOverview = async (req, res) => {
    try {
        const [serviceCounts, incidentCounts, alertCounts, recentIncidents] = await Promise.all([
            countByField(Service, 'status'),
            countByTwoFields(Incident, 'status', 'severity'),
            countByField(Alert, 'status'),
            Incident.find()
                .sort({ createdAt: -1 })
                .limit(RECENT_INCIDENTS_LIMIT)
                .populate({ path: 'service', select: 'id' })
                .populate({ path: 'createdBy', select: 'id' })
                .populate({ path: 'assignedTo', select: 'id' })
        ]);

        const servicesByStatus = applyGroupCounts(
            emptyCounts(SERVICE_STATUSES),
            serviceCounts.grouped
        );
        const downCount = servicesByStatus.down ?? 0;

        const incidentsByStatus = applyGroupCounts(
            emptyCounts(INCIDENT_STATUSES),
            incidentCounts.groupedA
        );
        const incidentsBySeverity = applyGroupCounts(
            emptyCounts(INCIDENT_SEVERITIES),
            incidentCounts.groupedB
        );

        const alertsByStatus = applyGroupCounts(
            emptyCounts(ALERT_STATUSES),
            alertCounts.grouped
        );

        const incidentResolved = incidentsByStatus.resolved ?? 0;
        const alertResolved = alertsByStatus.resolved ?? 0;

        for (const incident of recentIncidents) {
            await ensureIncidentIds(incident);
        }

        res.status(200).json({
            incidents: {
                total: incidentCounts.total,
                active: incidentCounts.total - incidentResolved,
                resolved: incidentResolved
            },
            incidents_by_severity: incidentsBySeverity,
            incidents_by_status: incidentsByStatus,
            services: {
                total: serviceCounts.total
            },
            services_by_status: {
                ...servicesByStatus,
                // Frontend KPI mapper reads partial_outage + major_outage for "Down".
                partial_outage: downCount,
                major_outage: 0
            },
            alerts: {
                total: alertCounts.total,
                active: alertCounts.total - alertResolved,
                resolved: alertResolved
            },
            alerts_by_status: alertsByStatus,
            recent_incidents: recentIncidents.map(toPublicIncident)
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

export { getDashboardOverview };
