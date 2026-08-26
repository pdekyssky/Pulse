import express from 'express';
import { listReports, getReportById, listIncidentReports } from '../controllers/reportController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/incidents', authMiddleware, listIncidentReports);
router.get('/', authMiddleware, listReports);
router.get('/:id', authMiddleware, getReportById);

export default router;
