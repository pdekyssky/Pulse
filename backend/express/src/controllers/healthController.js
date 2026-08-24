import mongoose from 'mongoose';

const MONGO_CONNECTED = 1;

const getHealth = (_req, res) => {
    res.status(200).json({
        status: 'ok'
    });
};

const getReadiness = (_req, res) => {
    if (mongoose.connection.readyState === MONGO_CONNECTED) {
        return res.status(200).json({
            status: 'ready'
        });
    }

    return res.status(503).json({
        status: 'not_ready'
    });
};

export { getHealth, getReadiness };
