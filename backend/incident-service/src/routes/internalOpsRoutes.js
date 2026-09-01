import express from 'express';
import { unassignUserIncidents } from '../controllers/incidentController.js';
import { getServiceById } from '../controllers/serviceController.js';

const router = express.Router();

router.post('/users/:userId/unassign', unassignUserIncidents);
router.get('/catalog/services/:id', getServiceById);

export default router;
