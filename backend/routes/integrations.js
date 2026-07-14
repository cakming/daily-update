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

/**
 * @openapi
 * /integrations/slack/status:
 *   get:
 *     summary: Get Slack link status
 *     tags: [Integrations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: 'Link status (linked, webhookUrl)' }
 * /integrations/slack/link:
 *   post:
 *     summary: Link a Slack incoming webhook
 *     tags: [Integrations]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [webhookUrl]
 *             properties:
 *               webhookUrl: { type: string, example: 'https://hooks.slack.com/services/...' }
 *     responses:
 *       200: { description: Linked }
 *       400: { description: Missing or invalid webhook URL }
 * /integrations/slack/unlink:
 *   delete:
 *     summary: Unlink the Slack webhook
 *     tags: [Integrations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Unlinked }
 * /integrations/slack/test:
 *   post:
 *     summary: Send a Slack test message
 *     tags: [Integrations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Sent }
 *       400: { description: Not linked }
 * /integrations/slack/daily/{id}:
 *   post:
 *     summary: Send a daily update to Slack
 *     tags: [Integrations]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sent }
 *       400: { description: Not linked }
 *       403: { description: Not the owner }
 *       404: { description: Update not found }
 *       502: { description: Slack send failed }
 * /integrations/slack/weekly/{id}:
 *   post:
 *     summary: Send a weekly summary to Slack
 *     tags: [Integrations]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sent }
 *       400: { description: Not linked }
 *       403: { description: Not the owner }
 *       404: { description: Update not found }
 *       502: { description: Slack send failed }
 * /integrations/googlechat/daily/{id}:
 *   post:
 *     summary: Send a daily update to Google Chat
 *     tags: [Integrations]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sent }
 *       400: { description: Not linked }
 *       403: { description: Not the owner }
 *       404: { description: Update not found }
 *       502: { description: Google Chat send failed }
 * /integrations/googlechat/weekly/{id}:
 *   post:
 *     summary: Send a weekly summary to Google Chat
 *     tags: [Integrations]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sent }
 *       400: { description: Not linked }
 *       403: { description: Not the owner }
 *       404: { description: Update not found }
 *       502: { description: Google Chat send failed }
 */

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
