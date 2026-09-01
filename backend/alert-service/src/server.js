import express from 'express';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import requireInternalAuth from './middlewares/requireInternalAuth.js';
import alertRoutes from './routes/alertRoutes.js';
import opsRoutes from './routes/opsRoutes.js';

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
app.use('/internal/alerts', alertRoutes);
app.use('/internal/ops', opsRoutes);

const PORT = process.env.PORT || 5004;

connectDB();

app.listen(PORT, () => {
    console.log(`Alert service is running on port ${PORT}`);
});
