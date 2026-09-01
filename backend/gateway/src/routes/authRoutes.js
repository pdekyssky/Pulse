import express from 'express';
import { GatewayError, internalRequest, internalRequestOk, serviceUrl } from '../lib/internalHttp.js';
import { authenticateGateway } from '../middlewares/auth.js';

const COOKIE_NAME = 'token';
const TOKEN_MAX_AGE_MS = 60 * 60 * 1000;

const router = express.Router();

function getCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: TOKEN_MAX_AGE_MS,
        path: '/'
    };
}

function userServiceUrl() {
    return serviceUrl('USER_SERVICE_URL', 'http://localhost:5002');
}

router.post('/register', async (req, res) => {
    try {
        const result = await internalRequest(userServiceUrl(), '/internal/auth/register', {
            method: 'POST',
            body: req.body,
            requestId: req.requestId
        });

        return res.status(result.status).json(result.json);
    } catch (error) {
        if (error instanceof GatewayError) {
            return res.status(error.status).json({ message: error.message });
        }

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const payload = await internalRequestOk(userServiceUrl(), '/internal/auth/login', {
            method: 'POST',
            body: req.body,
            requestId: req.requestId
        });

        if (payload.token) {
            res.cookie(COOKIE_NAME, payload.token, getCookieOptions());
        }

        return res.status(200).json({
            message: payload.message,
            user: payload.user
        });
    } catch (error) {
        if (error instanceof GatewayError) {
            return res.status(error.status).json({ message: error.message });
        }

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
});

router.post('/logout', (_req, res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });

    res.status(200).json({
        message: 'Logout successful'
    });
});

router.get('/me', authenticateGateway, (req, res) => {
    res.status(200).json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        is_active: req.user.is_active !== false,
        created_at: req.user.created_at,
        updated_at: req.user.updated_at
    });
});

export default router;
