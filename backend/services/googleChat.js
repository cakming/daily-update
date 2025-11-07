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
  const companyName = update.company?.name || 'No Company';
  const date = new Date(update.createdAt).toLocaleDateString();

  const card = {
    header: {
      title: '📝 Daily Update',
      subtitle: `${companyName} - ${date}`,
      imageUrl: 'https://via.placeholder.com/32',
    },
    sections: [
      {
        widgets: [
          ...(update.aiSummary
            ? [
                {
                  textParagraph: {
                    text: `<b>📌 AI Summary:</b><br>${update.aiSummary}`,
                  },
                },
              ]
            : []),
          {
            textParagraph: {
              text: `<b>Update Content:</b><br>${update.content.substring(0, 500)}${
                update.content.length > 500 ? '...' : ''
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
  const companyName = update.company?.name || 'No Company';
  const startDate = new Date(update.period.startDate).toLocaleDateString();
  const endDate = new Date(update.period.endDate).toLocaleDateString();

  const card = {
    header: {
      title: '📊 Weekly Summary',
      subtitle: `${companyName} - ${startDate} to ${endDate}`,
      imageUrl: 'https://via.placeholder.com/32',
    },
    sections: [
      {
        widgets: [
          ...(update.aiSummary
            ? [
                {
                  textParagraph: {
                    text: `<b>📌 AI Summary:</b><br>${update.aiSummary}`,
                  },
                },
              ]
            : []),
          {
            textParagraph: {
              text: `<b>📈 Statistics:</b><br>Updates Included: ${
                update.dailyUpdates?.length || 0
              }`,
            },
          },
          {
            textParagraph: {
              text: `<b>Weekly Summary:</b><br>${update.content.substring(0, 500)}${
                update.content.length > 500 ? '...' : ''
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
