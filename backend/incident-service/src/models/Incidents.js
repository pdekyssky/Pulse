import mongoose from 'mongoose';
import { getNextSequence } from './Sequence.js';

const INCIDENT_STATUSES = ['investigating', 'identified', 'monitoring', 'resolved'];
const INCIDENT_SEVERITIES = ['critical', 'high', 'medium', 'low'];

const incidentSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        sparse: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: INCIDENT_STATUSES,
        default: 'investigating'
    },
    severity: {
        type: String,
        enum: INCIDENT_SEVERITIES,
        default: 'medium'
    },
    service_id: {
        type: Number,
        required: true,
        index: true
    },
    created_by_id: {
        type: Number,
        required: true
    },
    assigned_to_id: {
        type: Number,
        default: null,
        index: true
    },
    startedAt: {
        type: Date
    },
    resolvedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

incidentSchema.pre('save', async function () {
    if (this.id == null) {
        this.id = await getNextSequence('incident');
    }

    if (this.isNew && !this.startedAt) {
        this.startedAt = new Date();
    }
});

incidentSchema.methods.ensureNumericId = async function () {
    if (typeof this.id === 'number') {
        return this;
    }

    this.id = await getNextSequence('incident');
    await this.updateOne({ id: this.id }, { timestamps: false });
    return this;
};

const Incident = mongoose.model('Incident', incidentSchema);

export { INCIDENT_STATUSES, INCIDENT_SEVERITIES };
export default Incident;
