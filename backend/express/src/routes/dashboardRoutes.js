import express from 'express';
import { getDashboardOverview } from '../controllers/dashboardController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/overview', authMiddleware, getDashboardOverview);

export default router;
