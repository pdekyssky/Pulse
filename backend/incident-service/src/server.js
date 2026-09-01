import express from 'express';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import requireInternalAuth from './middlewares/requireInternalAuth.js';
import incidentRoutes from './routes/incidentRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import timelineRoutes from './routes/timelineRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import internalOpsRoutes from './routes/internalOpsRoutes.js';

dotenv.config();

if (!process.env.MONGO_URI || !String(process.env.MONGO_URI).trim()) {
    console.error('MONGO_URI is required');
    process.exit(1);
}

if (!process.env.INTERNAL_API_KEY || !String(process.env.INTERNAL_API_KEY).trim()) {
    console.error('INTERNAL_API_KEY is required');
    process.exit(1);
}

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
});

app.use('/internal', requireInternalAuth);
app.use('/internal', internalOpsRoutes);
app.use('/internal/incidents', incidentRoutes);
app.use('/internal/services', serviceRoutes);
app.use('/internal/dashboard', dashboardRoutes);
app.use('/internal/timeline', timelineRoutes);
app.use('/internal/analytics', analyticsRoutes);
app.use('/internal/reports', reportRoutes);

const PORT = process.env.PORT || 5003;

connectDB();

app.listen(PORT, () => {
    console.log(`Incident service is running on port ${PORT}`);
});
