import jwt from 'jsonwebtoken';
import { GatewayError, internalRequestOk, serviceUrl } from '../lib/internalHttp.js';

function userServiceUrl() {
    return serviceUrl('USER_SERVICE_URL', 'http://localhost:5002');
}

export async function authenticateGateway(req, res, next) {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (
                error.name === 'JsonWebTokenError' ||
                error.name === 'TokenExpiredError' ||
                error.name === 'NotBeforeError'
            ) {
                return res.status(401).json({
                    message: 'Unauthorized'
                });
            }

            throw error;
        }

        const userId = Number(decoded.sub);
        if (!Number.isInteger(userId) || userId < 1) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        const user = await internalRequestOk(userServiceUrl(), '/internal/auth/me', {
            userId,
            requestId: req.requestId
        });

        if (!user || user.is_active === false) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        req.user = {
            id: user.id,
            role: user.role,
            name: user.name,
            email: user.email,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at
        };

        next();
    } catch (error) {
        if (error instanceof GatewayError) {
            const status = error.status === 401 ? 401 : error.status === 503 ? 503 : 401;
            return res.status(status).json({
                message: status === 503 ? 'Service unavailable' : 'Unauthorized'
            });
        }

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

export function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Admin access required'
        });
    }

    next();
}
