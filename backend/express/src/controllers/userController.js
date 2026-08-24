import User from '../models/User.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 6;

function toIso(value) {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

function toPublicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active !== false,
        created_at: toIso(user.createdAt),
        updated_at: toIso(user.updatedAt)
    };
}

function parsePositiveInt(value, fallback) {
    if (value === undefined || value === null || value === '') {
        return { value: fallback };
    }

    if (!/^\d+$/.test(String(value).trim())) {
        return { error: true };
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
        return { error: true };
    }

    return { value: parsed };
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasQueryValue(value) {
    return value !== undefined && value !== '';
}

const getUsers = async (req, res) => {
    try {
        const paginationRequested = hasQueryValue(req.query.page) || hasQueryValue(req.query.page_size);
        let page = DEFAULT_PAGE;
        let pageSize = DEFAULT_PAGE_SIZE;

        if (paginationRequested) {
            const pageResult = parsePositiveInt(req.query.page, DEFAULT_PAGE);
            const pageSizeResult = parsePositiveInt(req.query.page_size, DEFAULT_PAGE_SIZE);

            if (pageResult.error) {
                return res.status(400).json({ message: 'Invalid page' });
            }

            if (pageSizeResult.error) {
                return res.status(400).json({ message: 'Invalid page_size' });
            }

            page = pageResult.value;
            pageSize = pageSizeResult.value;
        }

        const filter = {};
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

        if (search) {
            const pattern = new RegExp(escapeRegex(search), 'i');
            filter.$or = [
                { name: pattern },
                { email: pattern }
            ];
        }

        const users = await User.find(filter)
            .select('id name email role is_active createdAt updatedAt')
            .sort({ name: 1, id: 1 });

        for (const user of users) {
            await user.ensureNumericId();
        }

        const publicUsers = users
            .filter((user) => typeof user.id === 'number')
            .map(toPublicUser);

        if (!paginationRequested) {
            return res.status(200).json(publicUsers);
        }

        const total = publicUsers.length;
        const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
        const skip = (page - 1) * pageSize;

        return res.status(200).json({
            items: publicUsers.slice(skip, skip + pageSize),
            page,
            page_size: pageSize,
            total,
            total_pages: totalPages
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const createUser = async (req, res) => {
    try {
        const user = await User.create(req.body)
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

export {
    getUsers,
    createUser
}

