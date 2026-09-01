import mongoose from 'mongoose';
import { getNextSequence } from './Sequence.js';

const SERVICE_STATUSES = ['operational', 'degraded', 'down'];

const serviceSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        sparse: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: SERVICE_STATUSES,
        default: 'operational'
    },
    owner_id: {
        type: Number,
        required: true
    },
    uptime: {
        type: Number,
        required: true
    }
}, { timestamps: true });

serviceSchema.pre('save', async function () {
    if (this.id == null) {
        this.id = await getNextSequence('service');
    }
});

serviceSchema.methods.ensureNumericId = async function () {
    if (typeof this.id === 'number') {
        return this;
    }

    this.id = await getNextSequence('service');
    await this.updateOne({ id: this.id });
    return this;
};

export { SERVICE_STATUSES };
export default mongoose.model('Service', serviceSchema);
