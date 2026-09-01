import express from 'express';
import { getAnalyticsOverview } from '../controllers/analyticsController.js';
import requireIdentity from '../middlewares/requireIdentity.js';

const router = express.Router();
router.get('/overview', requireIdentity, getAnalyticsOverview);
export default router;
