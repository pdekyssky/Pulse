import express from 'express';

import alertRoutes from './alertRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import healthRoutes from './healthRoutes.js';
import incidentRoutes from './incidentRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import reportRoutes from './reportRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import timelineRoutes from './timelineRoutes.js';
import userRoutes from './userRoutes.js';

const router = express.Router();

//api versioning
const v1 = express.Router();

v1.use('/auth', authRoutes);
v1.use('/users', userRoutes);
v1.use('/services', serviceRoutes);
v1.use('/incidents', incidentRoutes);
v1.use('/alerts', alertRoutes);
v1.use('/notifications', notificationRoutes);
v1.use('/dashboard', dashboardRoutes);
v1.use('/timeline', timelineRoutes);
v1.use('/analytics', analyticsRoutes);
v1.use('/reports', reportRoutes);
v1.use('/health', healthRoutes);

router.use('/v1', v1);

export default router;
