import express from 'express';
import {
    getAlertCounts,
    getTimelineAlerts,
    getReportAlerts,
    unlinkIncident
} from '../controllers/alertController.js';

const router = express.Router();

router.get('/alert-counts', getAlertCounts);
router.get('/timeline-alerts', getTimelineAlerts);
router.get('/report-alerts', getReportAlerts);
router.post('/unlink-incident/:incidentId', unlinkIncident);

export default router;
