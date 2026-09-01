import mongoose from 'mongoose';
import { getNextSequence } from './Sequence.js';

const incidentCommentSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        sparse: true
    },
    incident_id: {
        type: Number,
        required: true,
        index: true
    },
    author_id: {
        type: Number,
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, { timestamps: true });

incidentCommentSchema.pre('save', async function () {
    if (this.id == null) {
        this.id = await getNextSequence('incidentComment');
    }
});

incidentCommentSchema.methods.ensureNumericId = async function () {
    if (typeof this.id === 'number') {
        return this;
    }

    this.id = await getNextSequence('incidentComment');
    await this.updateOne({ id: this.id }, { timestamps: false });
    return this;
};

export default mongoose.model('IncidentComment', incidentCommentSchema);
