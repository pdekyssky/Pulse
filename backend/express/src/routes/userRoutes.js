import express from 'express';
import { createUser } from '../controllers/userController.js';

const router = express.Router();

// Create a new user
router.post('/', createUser);

export default router;
