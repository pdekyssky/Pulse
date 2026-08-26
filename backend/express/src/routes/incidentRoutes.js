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
    deleteIncident } from '../controllers/incidentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();


router.get('/', authMiddleware, getIncidents);
router.get('/:id/events', authMiddleware, getIncidentEvents);
router.post('/:id/events', authMiddleware, createIncidentEvent);
router.get('/:id/comments', authMiddleware, getIncidentComments);
router.post('/:id/comments', authMiddleware, createIncidentComment);
router.patch('/:id/comments/:commentId', authMiddleware, updateIncidentComment);
router.delete('/:id/comments/:commentId', authMiddleware, deleteIncidentComment);
router.get('/:id', authMiddleware, getIncidentById);
router.post('/', authMiddleware, adminMiddleware, createIncident);
router.patch('/:id', authMiddleware, adminMiddleware, updateIncident);
router.delete('/:id', authMiddleware, adminMiddleware, deleteIncident);



export default router;
