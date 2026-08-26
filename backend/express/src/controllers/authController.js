import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'token';
const TOKEN_MAX_AGE_MS = 60 * 60 * 1000;

function getCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: TOKEN_MAX_AGE_MS,
        path: '/'
    };
}

//toPublicUser - convert user object to public user object
function toPublicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active !== false,
        created_at: user.createdAt,
        updated_at: user.updatedAt
    };
}

//register
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email, and password are required'
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'user'
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: toPublicUser(user)
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'User already exists'
            });
        }

        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

//login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        if (user.is_active === false) {
            return res.status(401).json({
                message: 'Account is inactive'
            });
        }

        await user.ensureNumericId();

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie(COOKIE_NAME, token, getCookieOptions());

        res.status(200).json({
            message: 'Login successful',
            user: toPublicUser(user)
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

//logout
const logout = async (req, res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });

    res.status(200).json({
        message: 'Logout successful'
    });
}

//me
const me = async (req, res) => {
    await req.user.ensureNumericId();
    res.status(200).json(toPublicUser(req.user));
}

export { register, login, logout, me };
