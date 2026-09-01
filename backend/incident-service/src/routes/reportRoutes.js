import express from 'express';
import { listReports, getReportById, listIncidentReports } from '../controllers/reportController.js';
import requireIdentity from '../middlewares/requireIdentity.js';

const router = express.Router();
router.use(requireIdentity);
router.get('/incidents', listIncidentReports);
router.get('/', listReports);
router.get('/:id', getReportById);
export default router;
