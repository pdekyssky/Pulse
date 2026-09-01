import Incident, { INCIDENT_STATUSES, INCIDENT_SEVERITIES } from '../models/Incidents.js';
import Service, { SERVICE_STATUSES } from '../models/Service.js';
import { getAlertCounts } from '../clients/alertServiceClient.js';

const RECENT_INCIDENTS_LIMIT = 10;
const ALERT_STATUSES = ['new', 'acknowledged', 'resolved'];

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

function toPublicIncident(incident) {
    return {
        id: incident.id,
        title: incident.title,
        description: incident.description ?? null,
        status: incident.status,
        severity: incident.severity,
        service_id: incident.service_id ?? null,
        created_by_id: incident.created_by_id ?? null,
        assigned_to_id: incident.assigned_to_id ?? null,
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

const getDashboardOverview = async (req, res) => {
    try {
        const [serviceCounts, incidentCounts, alertCounts, recentIncidents] = await Promise.all([
            countByField(Service, 'status'),
            countByTwoFields(Incident, 'status', 'severity'),
            getAlertCounts(),
            Incident.find().sort({ createdAt: -1 }).limit(RECENT_INCIDENTS_LIMIT)
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

        const alertsByStatus = {
            ...emptyCounts(ALERT_STATUSES),
            ...(alertCounts.by_status || {})
        };
        const alertTotal = alertCounts.total ?? 0;
        const alertResolved = alertsByStatus.resolved ?? 0;

        for (const incident of recentIncidents) {
            await incident.ensureNumericId();
        }

        res.status(200).json({
            incidents: {
                total: incidentCounts.total,
                active: incidentCounts.total - (incidentsByStatus.resolved ?? 0),
                resolved: incidentsByStatus.resolved ?? 0
            },
            incidents_by_severity: incidentsBySeverity,
            incidents_by_status: incidentsByStatus,
            services: {
                total: serviceCounts.total
            },
            services_by_status: {
                ...servicesByStatus,
                partial_outage: downCount,
                major_outage: 0
            },
            alerts: {
                total: alertTotal,
                active: alertTotal - alertResolved,
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
