import { internalRequest } from '../lib/internalHttp.js';

function getIncidentServiceUrl() {
    const configured = process.env.INCIDENT_SERVICE_URL;
    if (configured && String(configured).trim()) {
        return String(configured).trim().replace(/\/$/, '');
    }

    return 'http://localhost:5003';
}

export async function getServiceById(serviceId) {
    return internalRequest(getIncidentServiceUrl(), `/internal/catalog/services/${serviceId}`);
}
