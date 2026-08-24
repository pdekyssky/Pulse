import express from 'express';
import {
    getAlerts,
    createAlert,
    acknowledgeAlert,
    resolveAlert
} from '../controllers/alertController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getAlerts);
router.post('/', authMiddleware, adminMiddleware, createAlert);
router.post('/:id/acknowledge', authMiddleware, adminMiddleware, acknowledgeAlert);
router.post('/:id/resolve', authMiddleware, adminMiddleware, resolveAlert);

export default router;
