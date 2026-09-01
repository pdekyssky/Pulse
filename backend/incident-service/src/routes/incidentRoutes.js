import express from 'express';
import {
    getIncidents,
    getIncidentById,
    getIncidentEvents,
    getIncidentComments,
    createIncidentEvent,
    createIncidentComment,
    updateIncidentComment,
    deleteIncidentComment,
    createIncident,
    updateIncident,
    deleteIncident
} from '../controllers/incidentController.js';
import requireIdentity from '../middlewares/requireIdentity.js';
import requireAdmin from '../middlewares/requireAdmin.js';

const router = express.Router();

router.use(requireIdentity);
router.get('/', getIncidents);
router.get('/:id/events', getIncidentEvents);
router.post('/:id/events', createIncidentEvent);
router.get('/:id/comments', getIncidentComments);
router.post('/:id/comments', createIncidentComment);
router.patch('/:id/comments/:commentId', updateIncidentComment);
router.delete('/:id/comments/:commentId', deleteIncidentComment);
router.get('/:id', getIncidentById);
router.post('/', requireAdmin, createIncident);
router.patch('/:id', requireAdmin, updateIncident);
router.delete('/:id', requireAdmin, deleteIncident);

export default router;
