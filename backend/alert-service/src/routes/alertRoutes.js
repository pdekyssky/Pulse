import express from 'express';
import {
    getAlerts,
    createAlert,
    acknowledgeAlert,
    resolveAlert
} from '../controllers/alertController.js';
import requireIdentity from '../middlewares/requireIdentity.js';
import requireAdmin from '../middlewares/requireAdmin.js';

const router = express.Router();

router.use(requireIdentity);
router.get('/', getAlerts);
router.post('/', requireAdmin, createAlert);
router.post('/:id/acknowledge', requireAdmin, acknowledgeAlert);
router.post('/:id/resolve', requireAdmin, resolveAlert);

export default router;
