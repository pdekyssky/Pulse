import express from 'express';
import {
    getServices,
    createService,
    updateService,
    deleteService
} from '../controllers/serviceController.js';
import requireIdentity from '../middlewares/requireIdentity.js';
import requireAdmin from '../middlewares/requireAdmin.js';

const router = express.Router();

router.use(requireIdentity);
router.get('/', getServices);
router.post('/', requireAdmin, createService);
router.patch('/:id', requireAdmin, updateService);
router.delete('/:id', requireAdmin, deleteService);

export default router;
