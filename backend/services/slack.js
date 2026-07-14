/**
 * Slack Service
 * Sends messages to Slack via Incoming Webhooks. Update formatting comes from
 * the shared updateFormatter so Slack renders the same fields as every other
 * channel.
 */
import { formatUpdate, truncate } from './updateFormatter.js';

/**
 * Post a Block Kit payload (or plain text) to a Slack incoming webhook.
 * Returns true on a 2xx response, false otherwise.
 */
export const sendSlackMessage = async (webhookUrl, payload) => {
  try {
    const body = typeof payload === 'string' ? { text: payload } : payload;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Slack responded ${response.status} ${response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error('Failed to send Slack message:', error);
    return false;
  }
};

// Build the shared Block Kit blocks for an update.
const buildBlocks = (headerText, view, user) => {
  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: headerText, emoji: true } },
  ];

  const context = [];
  if (view.companyLabel) context.push(`*Company:* ${view.companyLabel}`);
  if (view.dailyUpdatesCount != null) context.push(`*Updates:* ${view.dailyUpdatesCount}`);
  if (context.length) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: context.join('   ·   ') } });
  }

  blocks.push({ type: 'section', text: { type: 'mrkdwn', text: truncate(view.body, 2800) || '_No content_' } });

  const footer = [];
  if (view.tags.length) footer.push(`*Tags:* ${view.tags.join(', ')}`);
  footer.push(`From ${user.name}`);
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: footer.join('   ·   ') }] });

  return blocks;
};

/**
 * Send a daily update to Slack.
 */
export const sendDailyUpdateToSlack = async (webhookUrl, update, user, options = {}) => {
  const view = formatUpdate(update, options);
  const date = view.date ? new Date(view.date).toLocaleDateString() : '';
  const blocks = buildBlocks(`📝 Daily Update — ${view.companyLabel}${date ? ` · ${date}` : ''}`, view, user);
  return sendSlackMessage(webhookUrl, { text: `Daily Update — ${view.companyLabel}`, blocks });
};

/**
 * Send a weekly summary to Slack.
 */
export const sendWeeklySummaryToSlack = async (webhookUrl, update, user, options = {}) => {
  const view = formatUpdate(update, options);
  const start = view.dateRange?.start ? new Date(view.dateRange.start).toLocaleDateString() : '';
  const end = view.dateRange?.end ? new Date(view.dateRange.end).toLocaleDateString() : '';
  const range = start && end ? ` · ${start}–${end}` : '';
  const blocks = buildBlocks(`📊 Weekly Summary — ${view.companyLabel}${range}`, view, user);
  return sendSlackMessage(webhookUrl, { text: `Weekly Summary — ${view.companyLabel}`, blocks });
};

export default {
  sendSlackMessage,
  sendDailyUpdateToSlack,
  sendWeeklySummaryToSlack,
};
