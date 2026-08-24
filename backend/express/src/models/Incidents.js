import mongoose from 'mongoose';
import { getNextSequence } from './Counter.js';

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
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
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
