import express from 'express';
import {
    getServices,
    createService,
    updateService,
    deleteService
} from '../controllers/serviceController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getServices);
router.post('/', authMiddleware, adminMiddleware, createService);
router.patch('/:id', authMiddleware, adminMiddleware, updateService);
router.delete('/:id', authMiddleware, adminMiddleware, deleteService);

export default router;
