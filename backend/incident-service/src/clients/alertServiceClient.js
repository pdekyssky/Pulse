import { internalRequest } from '../lib/internalHttp.js';

function getAlertServiceUrl() {
    const configured = process.env.ALERT_SERVICE_URL;
    if (configured && String(configured).trim()) {
        return String(configured).trim().replace(/\/$/, '');
    }

    return 'http://localhost:5004';
}

export async function getAlertCounts() {
    try {
        return await internalRequest(getAlertServiceUrl(), '/internal/ops/alert-counts');
    } catch (error) {
        console.error('Failed to load alert counts', error);
        return {
            total: 0,
            by_status: {
                new: 0,
                acknowledged: 0,
                resolved: 0
            }
        };
    }
}

export async function getTimelineAlerts(query) {
    try {
        return await internalRequest(getAlertServiceUrl(), '/internal/ops/timeline-alerts', { query });
    } catch (error) {
        console.error('Failed to load timeline alerts', error);
        return [];
    }
}

export async function getReportAlerts(query) {
    try {
        return await internalRequest(getAlertServiceUrl(), '/internal/ops/report-alerts', { query });
    } catch (error) {
        console.error('Failed to load report alerts', error);
        return [];
    }
}

export async function unlinkIncident(incidentId) {
    try {
        return await internalRequest(
            getAlertServiceUrl(),
            `/internal/ops/unlink-incident/${incidentId}`,
            { method: 'POST' }
        );
    } catch (error) {
        console.error('Failed to unlink alerts from incident', error);
        return null;
    }
}
