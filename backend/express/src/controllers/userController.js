import User from '../models/User.js';

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
    createUser
}
