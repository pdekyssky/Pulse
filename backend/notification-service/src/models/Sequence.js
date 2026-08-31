import mongoose from 'mongoose';

const sequenceSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    seq: {
        type: Number,
        default: 0
    }
});

const Sequence = mongoose.model('Sequence', sequenceSchema);

export async function getNextNotificationId() {
    const counter = await Sequence.findByIdAndUpdate(
        'notification',
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );

    return counter.seq;
}
