/**
 * Google Chat Service
 * Handles sending messages to Google Chat via webhooks
 */
import { formatUpdate, truncate } from './updateFormatter.js';

/**
 * Send message to Google Chat webhook
 */
export const sendGoogleChatMessage = async (webhookUrl, message) => {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: message }),
    });

    if (!response.ok) {
      throw new Error(`Google Chat API error: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to send Google Chat message:', error);
    return false;
  }
};

/**
 * Send formatted card message to Google Chat
 */
export const sendGoogleChatCard = async (webhookUrl, card) => {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cards: [card] }),
    });

    if (!response.ok) {
      throw new Error(`Google Chat API error: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to send Google Chat card:', error);
    return false;
  }
};

/**
 * Send daily update to Google Chat
 */
export const sendDailyUpdateToGoogleChat = async (webhookUrl, update, user, options = {}) => {
  const view = formatUpdate(update, options);
  const date = view.date ? new Date(view.date).toLocaleDateString() : '';

  const card = {
    header: {
      title: '📝 Daily Update',
      subtitle: `${view.companyLabel} - ${date}`,
    },
    sections: [
      {
        widgets: [
          {
            textParagraph: {
              text: `<b>Update Content:</b><br>${truncate(view.body)}`,
            },
          },
          ...(view.tags.length > 0
            ? [
                {
                  textParagraph: {
                    text: `<b>Tags:</b> ${view.tags.join(', ')}`,
                  },
                },
              ]
            : []),
          {
            textParagraph: {
              text: `<i>From: ${user.name}</i>`,
            },
          },
        ],
      },
    ],
  };

  return sendGoogleChatCard(webhookUrl, card);
};

/**
 * Send weekly summary to Google Chat
 */
export const sendWeeklySummaryToGoogleChat = async (webhookUrl, update, user, options = {}) => {
  const view = formatUpdate(update, options);
  const startDate = new Date(view.dateRange?.start).toLocaleDateString();
  const endDate = new Date(view.dateRange?.end).toLocaleDateString();

  const card = {
    header: {
      title: '📊 Weekly Summary',
      subtitle: `${view.companyLabel} - ${startDate} to ${endDate}`,
    },
    sections: [
      {
        widgets: [
          {
            textParagraph: {
              text: `<b>📈 Statistics:</b><br>Updates Included: ${view.dailyUpdatesCount}`,
            },
          },
          {
            textParagraph: {
              text: `<b>Weekly Summary:</b><br>${truncate(view.body)}`,
            },
          },
          ...(view.tags.length > 0
            ? [
                {
                  textParagraph: {
                    text: `<b>Tags:</b> ${view.tags.join(', ')}`,
                  },
                },
              ]
            : []),
          {
            textParagraph: {
              text: `<i>From: ${user.name}</i>`,
            },
          },
        ],
      },
    ],
  };

  return sendGoogleChatCard(webhookUrl, card);
};

export default {
  sendGoogleChatMessage,
  sendGoogleChatCard,
  sendDailyUpdateToGoogleChat,
  sendWeeklySummaryToGoogleChat,
};
