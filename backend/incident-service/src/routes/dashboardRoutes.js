import express from 'express';
import { getDashboardOverview } from '../controllers/dashboardController.js';
import requireIdentity from '../middlewares/requireIdentity.js';

const router = express.Router();
router.get('/overview', requireIdentity, getDashboardOverview);
export default router;
