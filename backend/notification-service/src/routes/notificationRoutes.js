import express from 'express';
import requireUserId from '../middlewares/requireUserId.js';
import {
    listNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    createNotification,
    deleteNotificationsForUser
} from '../controllers/notificationController.js';

const router = express.Router();

router.post('/', createNotification);
router.delete('/user/:userId', deleteNotificationsForUser);
router.get('/', requireUserId, listNotifications);
router.patch('/read-all', requireUserId, markAllNotificationsRead);
router.patch('/:id/read', requireUserId, markNotificationRead);

export default router;
