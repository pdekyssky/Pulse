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

export async function getNextSequence(name) {
    const counter = await Sequence.findByIdAndUpdate(
        name,
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );

    return counter.seq;
}
