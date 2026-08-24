import mongoose from 'mongoose';
import { getNextSequence } from './Counter.js';

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
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    incident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Incident',
        default: null
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
