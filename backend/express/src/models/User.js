import mongoose from 'mongoose';
import { getNextSequence } from './Counter.js';

const userSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        sparse: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'user'],
        default: 'user'
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (this.id == null) {
        this.id = await getNextSequence('user');
    }
});

userSchema.methods.ensureNumericId = async function () {
    if (typeof this.id === 'number') {
        return this;
    }

    this.id = await getNextSequence('user');
    await this.save();
    return this;
};

userSchema.set('toJSON', {
    transform(_doc, ret) {
        delete ret.password;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('User', userSchema);
