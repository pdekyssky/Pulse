import mongoose from 'mongoose';
import { getNextNotificationId } from './Sequence.js';

const notificationSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        sparse: true
    },
    user_id: {
        type: Number,
        required: true,
        index: true
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
    incident_id: {
        type: Number,
        default: null
    },
    alert_id: {
        type: Number,
        default: null
    }
}, { timestamps: true });

notificationSchema.pre('save', async function () {
    if (this.id == null) {
        this.id = await getNextNotificationId();
    }
});

export default mongoose.model('Notification', notificationSchema);
