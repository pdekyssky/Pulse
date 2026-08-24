import mongoose from 'mongoose';


const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        enum: ['operational', 'degraded', 'down'],
        default: 'operational'
    }
}, { timestamps: true });

export default mongoose.model('Service', serviceSchema);
