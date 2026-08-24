import Service from '../models/Service.js';

const createService = async (req, res) => {
    try {
        const service = await Service.create(req.body)
        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

export {
    createService
}