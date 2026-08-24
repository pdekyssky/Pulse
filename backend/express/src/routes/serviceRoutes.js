import express from 'express';
import { createService } from '../controllers/serviceController.js';


const router = express.Router();

router.post('/', createService);

export default router;