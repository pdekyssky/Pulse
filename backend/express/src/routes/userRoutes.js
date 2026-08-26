import express from 'express';
import {
    createUser,
    deleteUser,
    getUserById,
    getUsers,
    updateUser
} from '../controllers/userController.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getUsers);
router.post('/', authMiddleware, adminMiddleware, createUser);
router.get('/:id', authMiddleware, getUserById);
router.patch('/:id', authMiddleware, adminMiddleware, updateUser);
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser);

export default router;
