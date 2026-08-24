import Incident from '../models/Incidents.js';

const getIncidents = async (req, res) => {
    try {
        const incidents = await Incident.find()
        .populate('service')
        .populate('createdBy');

        res.status(200).json(incidents);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getIncidentById = async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id)
        .populate('service')
        .populate('createdBy');

        res.json(incident);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};


const createIncident = async (req, res) => {
    try {
        const incident = await Incident.create(req.body)
        res.status(201).json(incident);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

const updateIncident = async (req, res) => {
    try {
        const incident = await Incident.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        .populate('service')
        .populate('createdBy');

        res.status(200).json(incident);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

const deleteIncident = async (req, res) => {
    try {
        const incident = await Incident.findByIdAndDelete(req.params.id);

        if(!incident) {
            return res.status(404).json({
                message: 'Incident not found'
            });
        }

        res.status(200).json({
            message: 'Incident deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

export { getIncidents, getIncidentById, createIncident, updateIncident, deleteIncident };
