import mongoose from 'mongoose';

const incidentSchemma = new mongoose.Schema({
    title: {
        type: String, 
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'investigating', 'resolved'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    severity: {
        type: String,
        enum: ['minor', 'major', 'critical'],
        default: 'minor'
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
        ref: 'User'
    }
}, { timestamps: true });


const Incident = mongoose.model('Incident', incidentSchemma);

export default Incident;
