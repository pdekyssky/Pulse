import mongoose from 'mongoose';
import { getNextSequence } from './Counter.js';

const notificationSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        sparse: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    incident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Incident',
        default: null
    },
    alert: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alert',
        default: null
    }
}, { timestamps: true });

notificationSchema.pre('save', async function () {
    if (this.id == null) {
        this.id = await getNextSequence('notification');
    }
});

notificationSchema.methods.ensureNumericId = async function () {
    if (typeof this.id === 'number') {
        return this;
    }

    this.id = await getNextSequence('notification');
    await this.updateOne({ id: this.id }, { timestamps: false });
    return this;
};

export default mongoose.model('Notification', notificationSchema);
