function parsePositiveInt(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    if (!/^\d+$/.test(String(value).trim())) {
        return null;
    }

    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        return null;
    }

    return id;
}

const requireUserId = (req, res, next) => {
    const raw = req.headers['x-user-id'];

    if (raw === undefined || raw === null || String(raw).trim() === '') {
        return res.status(400).json({
            message: 'X-User-Id header is required'
        });
    }

    const userId = parsePositiveInt(raw);
    if (!userId) {
        return res.status(400).json({
            message: 'Invalid X-User-Id'
        });
    }

    req.userId = userId;
    next();
};

export default requireUserId;
export { parsePositiveInt };
