import express from 'express';
import {
  linkTelegram,
  unlinkTelegram,
  getTelegramStatus,
  sendTelegramTest,
  linkGoogleChat,
  unlinkGoogleChat,
  getGoogleChatStatus,
  sendGoogleChatTest,
} from '../controllers/integrationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Telegram routes
router.get('/telegram/status', getTelegramStatus);
router.post('/telegram/link', linkTelegram);
router.delete('/telegram/unlink', unlinkTelegram);
router.post('/telegram/test', sendTelegramTest);

// Google Chat routes
router.get('/googlechat/status', getGoogleChatStatus);
router.post('/googlechat/link', linkGoogleChat);
router.delete('/googlechat/unlink', unlinkGoogleChat);
router.post('/googlechat/test', sendGoogleChatTest);

export default router;
