import mongoose from 'mongoose';
import { getNextSequence } from './Counter.js';

const incidentEventSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        sparse: true
    },
    incident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Incident',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventType: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, { timestamps: true });

incidentEventSchema.pre('save', async function () {
    if (this.id == null) {
        this.id = await getNextSequence('incidentEvent');
    }
});

incidentEventSchema.methods.ensureNumericId = async function () {
    if (typeof this.id === 'number') {
        return this;
    }

    this.id = await getNextSequence('incidentEvent');
    await this.updateOne({ id: this.id }, { timestamps: false });
    return this;
};

export default mongoose.model('IncidentEvent', incidentEventSchema);
