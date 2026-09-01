import express from 'express';
import { getTimeline } from '../controllers/timelineController.js';
import requireIdentity from '../middlewares/requireIdentity.js';

const router = express.Router();
router.get('/', requireIdentity, getTimeline);
export default router;
