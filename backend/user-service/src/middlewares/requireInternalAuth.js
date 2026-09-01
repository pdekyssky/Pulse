import crypto from 'node:crypto';

function getExpectedApiKey() {
    const key = process.env.INTERNAL_API_KEY;
    if (!key || !String(key).trim()) {
        return null;
    }

    return String(key).trim();
}

function parseBearerToken(header) {
    if (!header || typeof header !== 'string') {
        return null;
    }

    const match = header.match(/^Bearer\s+(\S+)$/i);
    if (!match) {
        return null;
    }

    return match[1];
}

function secretsEqual(provided, expected) {
    const providedBuffer = Buffer.from(provided);
    const expectedBuffer = Buffer.from(expected);

    if (providedBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

const requireInternalAuth = (req, res, next) => {
    const expected = getExpectedApiKey();
    if (!expected) {
        return res.status(500).json({
            message: 'Internal server error'
        });
    }

    const token = parseBearerToken(req.headers.authorization);
    if (!token || !secretsEqual(token, expected)) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    next();
};

export default requireInternalAuth;
