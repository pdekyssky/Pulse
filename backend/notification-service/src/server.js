import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

if (!process.env.MONGO_URI || !String(process.env.MONGO_URI).trim()) {
    console.error('MONGO_URI is required');
    process.exit(1);
}

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use('/internal/notifications', notificationRoutes);

const PORT = process.env.PORT || 5001;

connectDB();

app.listen(PORT, () => {
    console.log(`Notification service is running on port ${PORT}`);
});
