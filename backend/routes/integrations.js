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
  sendGoogleChatDaily,
  sendGoogleChatWeekly,
  linkSlack,
  unlinkSlack,
  getSlackStatus,
  sendSlackTest,
  sendSlackDaily,
  sendSlackWeekly,
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
router.post('/googlechat/daily/:id', sendGoogleChatDaily);
router.post('/googlechat/weekly/:id', sendGoogleChatWeekly);

// Slack routes
router.get('/slack/status', getSlackStatus);
router.post('/slack/link', linkSlack);
router.delete('/slack/unlink', unlinkSlack);
router.post('/slack/test', sendSlackTest);
router.post('/slack/daily/:id', sendSlackDaily);
router.post('/slack/weekly/:id', sendSlackWeekly);

export default router;
