import express from 'express';
import { 
    getIncidents, 
    getIncidentById,
    getIncidentEvents,
    getIncidentComments,
    createIncident,
    updateIncident,
    deleteIncident } from '../controllers/incidentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();


router.get('/', authMiddleware, getIncidents);
router.get('/:id/events', authMiddleware, getIncidentEvents);
router.get('/:id/comments', authMiddleware, getIncidentComments);
router.get('/:id', authMiddleware, getIncidentById);
router.post('/', authMiddleware, adminMiddleware, createIncident);
router.patch('/:id', authMiddleware, adminMiddleware, updateIncident);
router.delete('/:id', authMiddleware, adminMiddleware, deleteIncident);



export default router;
