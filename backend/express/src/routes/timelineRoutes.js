import express from 'express';
import { getTimeline } from '../controllers/timelineController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getTimeline);

export default router;
