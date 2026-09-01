import express from 'express';
import { register, login, me } from '../controllers/authController.js';
import requireIdentity from '../middlewares/requireIdentity.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireIdentity, me);

export default router;
