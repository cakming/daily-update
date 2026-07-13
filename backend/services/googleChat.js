/**
 * Google Chat Service
 * Handles sending messages to Google Chat via webhooks
 */

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
export const sendDailyUpdateToGoogleChat = async (webhookUrl, update, user) => {
  const companyName = update.companyId?.name || 'No Company';
  const date = new Date(update.date || update.createdAt).toLocaleDateString();
  const content = update.formattedOutput || '';

  const card = {
    header: {
      title: '📝 Daily Update',
      subtitle: `${companyName} - ${date}`,
    },
    sections: [
      {
        widgets: [
          {
            textParagraph: {
              text: `<b>Update Content:</b><br>${content.substring(0, 500)}${
                content.length > 500 ? '...' : ''
              }`,
            },
          },
          ...(update.tags && update.tags.length > 0
            ? [
                {
                  textParagraph: {
                    text: `<b>Tags:</b> ${update.tags.map((tag) => tag.name).join(', ')}`,
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
export const sendWeeklySummaryToGoogleChat = async (webhookUrl, update, user) => {
  const companyName = update.companyId?.name || 'No Company';
  const startDate = new Date(update.dateRange?.start).toLocaleDateString();
  const endDate = new Date(update.dateRange?.end).toLocaleDateString();
  const content = update.formattedOutput || '';

  const card = {
    header: {
      title: '📊 Weekly Summary',
      subtitle: `${companyName} - ${startDate} to ${endDate}`,
    },
    sections: [
      {
        widgets: [
          {
            textParagraph: {
              text: `<b>📈 Statistics:</b><br>Updates Included: ${
                update.dailyUpdates?.length || 0
              }`,
            },
          },
          {
            textParagraph: {
              text: `<b>Weekly Summary:</b><br>${content.substring(0, 500)}${
                content.length > 500 ? '...' : ''
              }`,
            },
          },
          ...(update.tags && update.tags.length > 0
            ? [
                {
                  textParagraph: {
                    text: `<b>Tags:</b> ${update.tags.map((tag) => tag.name).join(', ')}`,
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
