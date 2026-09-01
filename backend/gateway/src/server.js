import express from 'express';
import crypto from 'node:crypto';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { proxyToService, serviceUrl } from './lib/internalHttp.js';
import { authenticateGateway, requireAdmin } from './middlewares/auth.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

if (!process.env.JWT_SECRET || !String(process.env.JWT_SECRET).trim()) {
    console.error('JWT_SECRET is required');
    process.exit(1);
}

if (!process.env.INTERNAL_API_KEY || !String(process.env.INTERNAL_API_KEY).trim()) {
    console.error('INTERNAL_API_KEY is required');
    process.exit(1);
}

const app = express();

const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173'
]);

if (process.env.CLIENT_ORIGIN) {
    allowedOrigins.add(process.env.CLIENT_ORIGIN);
}

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }

        callback(null, false);
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
    delete req.headers['x-user-id'];
    delete req.headers['x-user-role'];
    delete req.headers['x-user-name'];

    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
});

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

const userService = () => serviceUrl('USER_SERVICE_URL', 'http://localhost:5002');
const incidentService = () => serviceUrl('INCIDENT_SERVICE_URL', 'http://localhost:5003');
const alertService = () => serviceUrl('ALERT_SERVICE_URL', 'http://localhost:5004');
const notificationService = () => serviceUrl('NOTIFICATION_SERVICE_URL', 'http://localhost:5001');

app.use('/api/v1/auth', authRoutes);

app.get('/api/v1/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get('/api/v1/health/ready', (_req, res) => {
    res.status(200).json({ status: 'ready' });
});

function mountProxy(publicPath, getBaseUrl, internalPrefix, extraMiddleware = []) {
    app.use(publicPath, ...extraMiddleware, (req, res) => {
        const suffix = req.path === '/' ? '' : req.path;
        return proxyToService(req, res, getBaseUrl(), `${internalPrefix}${suffix}`);
    });
}

mountProxy('/api/v1/users', userService, '/internal/users', [authenticateGateway]);
mountProxy('/api/v1/incidents', incidentService, '/internal/incidents', [authenticateGateway]);
mountProxy('/api/v1/services', incidentService, '/internal/services', [authenticateGateway]);
mountProxy('/api/v1/dashboard', incidentService, '/internal/dashboard', [authenticateGateway]);
mountProxy('/api/v1/timeline', incidentService, '/internal/timeline', [authenticateGateway]);
mountProxy('/api/v1/analytics', incidentService, '/internal/analytics', [authenticateGateway]);
mountProxy('/api/v1/reports', incidentService, '/internal/reports', [authenticateGateway]);
mountProxy('/api/v1/alerts', alertService, '/internal/alerts', [authenticateGateway]);

app.use('/api/v1/notifications', authenticateGateway, (req, res) => {
    if (!['GET', 'PATCH'].includes(req.method)) {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const suffix = req.path === '/' ? '' : req.path;
    return proxyToService(req, res, notificationService(), `/internal/notifications${suffix}`);
});

// Admin mutations are re-checked inside services using X-User-Role.
void requireAdmin;

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`API gateway is running on port ${PORT}`);
});
