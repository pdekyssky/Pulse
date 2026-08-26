import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Incident from '../models/Incidents.js';
import Notification from '../models/Notification.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 6;
const ALLOWED_ROLES = ['admin', 'manager', 'user'];
const PATCH_FIELDS = new Set(['is_active', 'role']);

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

function parseNumericId(value) {
    if (value === undefined || value === null || value === '') {
        return { missing: true };
    }

    if (!/^\d+$/.test(String(value).trim())) {
        return { error: true };
    }

    const id = Number(value);

    if (!Number.isInteger(id) || id < 1) {
        return { error: true };
    }

    return { id };
}

function parseIsActive(value) {
    if (value === undefined || value === '') {
        return { missing: true };
    }

    if (value === true || value === 'true') {
        return { value: true };
    }

    if (value === false || value === 'false') {
        return { value: false };
    }

    return { error: true };
}

function isSameUser(a, b) {
    return Boolean(a && b && String(a._id) === String(b._id));
}

function isActiveAdmin(user) {
    return user.role === 'admin' && user.is_active !== false;
}

async function countAdmins() {
    return User.countDocuments({ role: 'admin' });
}

async function countActiveAdmins() {
    return User.countDocuments({
        role: 'admin',
        is_active: { $ne: false }
    });
}

function usersQuery(filter) {
    return User.find(filter).select('id name email role is_active createdAt updatedAt');
}

async function findUserByParamId(req, res) {
    const parsed = parseNumericId(req.params.id);

    if (parsed.missing || parsed.error) {
        res.status(400).json({
            message: 'Invalid user ID'
        });
        return null;
    }

    const user = await User.findOne({ id: parsed.id }).select(
        'id name email role is_active createdAt updatedAt'
    );

    if (!user) {
        res.status(404).json({
            message: 'User not found'
        });
        return null;
    }

    await user.ensureNumericId();
    return user;
}

async function buildUserListFilter(query) {
    const filter = {};
    const search = typeof query.search === 'string' ? query.search.trim() : '';

    if (search) {
        const pattern = new RegExp(escapeRegex(search), 'i');
        filter.$or = [
            { name: pattern },
            { email: pattern }
        ];
    }

    if (hasQueryValue(query.role)) {
        if (!ALLOWED_ROLES.includes(query.role)) {
            return { error: 'Invalid role' };
        }
        filter.role = query.role;
    }

    const isActiveResult = parseIsActive(query.is_active);
    if (isActiveResult.error) {
        return { error: 'Invalid is_active' };
    }
    if (!isActiveResult.missing) {
        filter.is_active = isActiveResult.value ? { $ne: false } : false;
    }

    return { filter };
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

        const filterResult = await buildUserListFilter(req.query);
        if (filterResult.error) {
            return res.status(400).json({
                message: filterResult.error
            });
        }

        const filter = filterResult.filter;

        if (!paginationRequested) {
            const users = await usersQuery(filter).sort({ name: 1, id: 1 });

            for (const user of users) {
                await user.ensureNumericId();
            }

            return res.status(200).json(
                users
                    .filter((user) => typeof user.id === 'number')
                    .map(toPublicUser)
            );
        }

        const total = await User.countDocuments(filter);
        const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
        const skip = (page - 1) * pageSize;

        const users = await usersQuery(filter)
            .sort({ name: 1, id: 1 })
            .skip(skip)
            .limit(pageSize);

        for (const user of users) {
            await user.ensureNumericId();
        }

        return res.status(200).json({
            items: users
                .filter((user) => typeof user.id === 'number')
                .map(toPublicUser),
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

const getUserById = async (req, res) => {
    try {
        const user = await findUserByParamId(req, res);
        if (!user) {
            return;
        }

        res.status(200).json(toPublicUser(user));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const createUser = async (req, res) => {
    try {
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
        const password = typeof req.body.password === 'string' ? req.body.password : '';
        const roleInput = req.body.role;

        if (!name) {
            return res.status(400).json({
                message: 'Name is required'
            });
        }

        if (!email) {
            return res.status(400).json({
                message: 'Email is required'
            });
        }

        if (!password) {
            return res.status(400).json({
                message: 'Password is required'
            });
        }

        const role = roleInput === undefined || roleInput === null || roleInput === ''
            ? 'user'
            : roleInput;

        if (typeof role !== 'string' || !ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({
                message: 'Invalid role. Must be admin, manager, or user'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'Email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            is_active: true
        });

        await user.ensureNumericId();

        res.status(201).json(toPublicUser(user));
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Email already exists'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const user = await findUserByParamId(req, res);

        if (!user) {
            return;
        }

        const body = req.body;

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return res.status(400).json({
                message: 'Invalid request body'
            });
        }

        const keys = Object.keys(body);
        const invalidFields = keys.filter((key) => !PATCH_FIELDS.has(key));

        if (invalidFields.length > 0) {
            return res.status(400).json({
                message: `Invalid fields: ${invalidFields.join(', ')}`
            });
        }

        if (keys.length === 0) {
            return res.status(400).json({
                message: 'Provide is_active and/or role'
            });
        }

        let nextRole = user.role;
        let nextActive = user.is_active !== false;

        if (Object.prototype.hasOwnProperty.call(body, 'role')) {
            if (typeof body.role !== 'string' || !ALLOWED_ROLES.includes(body.role)) {
                return res.status(400).json({
                    message: 'Invalid role. Must be admin, manager, or user'
                });
            }

            nextRole = body.role;
        }

        if (Object.prototype.hasOwnProperty.call(body, 'is_active')) {
            if (typeof body.is_active !== 'boolean') {
                return res.status(400).json({
                    message: 'is_active must be a boolean'
                });
            }

            nextActive = body.is_active;
        }

        const actingOnSelf = isSameUser(req.user, user);

        if (actingOnSelf && user.is_active !== false && nextActive === false) {
            return res.status(400).json({
                message: 'You cannot deactivate your own account'
            });
        }

        if (actingOnSelf && user.role === 'admin' && nextRole !== 'admin') {
            return res.status(400).json({
                message: 'You cannot change your own admin role'
            });
        }

        if (user.role === 'admin' && nextRole !== 'admin') {
            const adminCount = await countAdmins();
            if (adminCount <= 1) {
                return res.status(400).json({
                    message: 'Cannot change the role of the last admin'
                });
            }
        }

        if (isActiveAdmin(user) && nextActive === false) {
            const activeAdminCount = await countActiveAdmins();
            if (activeAdminCount <= 1) {
                return res.status(400).json({
                    message: 'Cannot deactivate the last active admin'
                });
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, 'role')) {
            user.role = nextRole;
        }

        if (Object.prototype.hasOwnProperty.call(body, 'is_active')) {
            user.is_active = nextActive;
        }

        await user.save();

        res.status(200).json(toPublicUser(user));
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await findUserByParamId(req, res);

        if (!user) {
            return;
        }

        if (isSameUser(req.user, user)) {
            return res.status(400).json({
                message: 'You cannot delete your own account'
            });
        }

        if (user.role === 'admin') {
            const adminCount = await countAdmins();
            if (adminCount <= 1) {
                return res.status(400).json({
                    message: 'Cannot delete the last admin account'
                });
            }
        }

        const publicUser = toPublicUser(user);

        await Incident.updateMany(
            { assignedTo: user._id },
            { $set: { assignedTo: null } }
        );
        await Notification.deleteMany({ user: user._id });
        await user.deleteOne();

        res.status(200).json({
            message: 'User deleted successfully',
            user: publicUser
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

export {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
