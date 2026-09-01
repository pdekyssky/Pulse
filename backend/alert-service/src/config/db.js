import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Alert service MongoDB connected');
    } catch (error) {
        console.error('Alert service MongoDB connection error:', error);
        process.exit(1);
    }
};

export default connectDB;
