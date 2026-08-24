import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
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

userSchema.set('toJSON', {
    transform(_doc, ret) {
        delete ret.password;
        return ret;
    }
});

export default mongoose.model('User', userSchema);
