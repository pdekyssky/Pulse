import mongoose from 'mongoose';
import { getNextSequence } from './Sequence.js';

const ALERT_STATUSES = ['new', 'acknowledged', 'resolved'];
const ALERT_SEVERITIES = ['critical', 'high', 'medium', 'low'];

const alertSchema = new mongoose.Schema({
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
        enum: ALERT_STATUSES,
        default: 'new'
    },
    severity: {
        type: String,
        enum: ALERT_SEVERITIES,
        required: true
    },
    service_id: {
        type: Number,
        required: true,
        index: true
    },
    incident_id: {
        type: Number,
        default: null,
        index: true
    }
}, { timestamps: true });

alertSchema.pre('save', async function () {
    if (this.id == null) {
        this.id = await getNextSequence('alert');
    }
});

alertSchema.methods.ensureNumericId = async function () {
    if (typeof this.id === 'number') {
        return this;
    }

    this.id = await getNextSequence('alert');
    await this.updateOne({ id: this.id }, { timestamps: false });
    return this;
};

export { ALERT_STATUSES, ALERT_SEVERITIES };
export default mongoose.model('Alert', alertSchema);
