import express from 'express';
import {
    createUser,
    deleteUser,
    getUserById,
    getUsers,
    updateUser
} from '../controllers/userController.js';
import requireIdentity from '../middlewares/requireIdentity.js';
import requireAdmin from '../middlewares/requireAdmin.js';

const router = express.Router();

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', requireIdentity, requireAdmin, createUser);
router.patch('/:id', requireIdentity, requireAdmin, updateUser);
router.delete('/:id', requireIdentity, requireAdmin, deleteUser);

export default router;
