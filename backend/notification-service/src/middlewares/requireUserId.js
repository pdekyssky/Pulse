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
    const userId = parsePositiveInt(req.headers['x-user-id']);

    if (!userId) {
        return res.status(400).json({
            message: 'X-User-Id header is required'
        });
    }

    req.userId = userId;
    next();
};

export default requireUserId;
export { parsePositiveInt };
