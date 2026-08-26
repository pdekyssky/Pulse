import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import routes from './routes/index.js';

dotenv.config();

if (!process.env.JWT_SECRET || !String(process.env.JWT_SECRET).trim()) {
    console.error('JWT_SECRET is required');
    process.exit(1);
}

const app = express();

const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
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
}))
app.use(express.json())
app.use(cookieParser())


app.use('/api', routes);

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
