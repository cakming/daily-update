import User from '../models/User.js';
import { sendTelegramMessage } from '../services/telegramBot.js';
import { sendGoogleChatMessage } from '../services/googleChat.js';

/**
 * Integration Controller
 * Handles third-party integrations (Telegram, Google Chat)
 */

/**
 * @route   POST /api/integrations/telegram/link
 * @desc    Link Telegram account
 * @access  Private
 */
export const linkTelegram = async (req, res) => {
  try {
    const { telegramId } = req.body;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your Telegram ID',
      });
    }

    // Check if Telegram ID is already linked to another account
    const existingUser = await User.findOne({ telegramId });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'This Telegram account is already linked to another user',
      });
    }

    // Link Telegram ID to user
    const user = await User.findById(req.user._id);
    user.telegramId = telegramId;
    await user.save({ validateBeforeSave: false });

    // Send confirmation message
    await sendTelegramMessage(
      telegramId,
      `✅ Your Telegram account has been successfully linked to Daily Update!\n\nYou can now use bot commands to interact with your updates.`
    );

    res.json({
      success: true,
      message: 'Telegram account linked successfully',
      data: {
        telegramId,
      },
    });
  } catch (error) {
    console.error('Link Telegram error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link Telegram account',
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/integrations/telegram/unlink
 * @desc    Unlink Telegram account
 * @access  Private
 */
export const unlinkTelegram = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.telegramId) {
      return res.status(400).json({
        success: false,
        message: 'No Telegram account is linked',
      });
    }

    // Send goodbye message
    await sendTelegramMessage(
      user.telegramId,
      `👋 Your Telegram account has been unlinked from Daily Update.\n\nYou can link it again anytime from your profile settings.`
    );

    user.telegramId = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Telegram account unlinked successfully',
    });
  } catch (error) {
    console.error('Unlink Telegram error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlink Telegram account',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/integrations/telegram/status
 * @desc    Get Telegram link status
 * @access  Private
 */
export const getTelegramStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        linked: !!user.telegramId,
        telegramId: user.telegramId || null,
      },
    });
  } catch (error) {
    console.error('Get Telegram status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Telegram status',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/integrations/googlechat/link
 * @desc    Link Google Chat webhook
 * @access  Private
 */
export const linkGoogleChat = async (req, res) => {
  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a webhook URL',
      });
    }

    // Validate webhook URL format
    if (!webhookUrl.startsWith('https://chat.googleapis.com/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google Chat webhook URL',
      });
    }

    const user = await User.findById(req.user._id).select('+googleChatWebhook');
    user.googleChatWebhook = webhookUrl;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Google Chat webhook linked successfully',
      data: {
        webhookUrl: webhookUrl.substring(0, 50) + '...',
      },
    });
  } catch (error) {
    console.error('Link Google Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link Google Chat webhook',
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/integrations/googlechat/unlink
 * @desc    Unlink Google Chat webhook
 * @access  Private
 */
export const unlinkGoogleChat = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+googleChatWebhook');

    if (!user.googleChatWebhook) {
      return res.status(400).json({
        success: false,
        message: 'No Google Chat webhook is linked',
      });
    }

    user.googleChatWebhook = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Google Chat webhook unlinked successfully',
    });
  } catch (error) {
    console.error('Unlink Google Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlink Google Chat webhook',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/integrations/googlechat/status
 * @desc    Get Google Chat link status
 * @access  Private
 */
export const getGoogleChatStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+googleChatWebhook');

    res.json({
      success: true,
      data: {
        linked: !!user.googleChatWebhook,
        webhookUrl: user.googleChatWebhook
          ? user.googleChatWebhook.substring(0, 50) + '...'
          : null,
      },
    });
  } catch (error) {
    console.error('Get Google Chat status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Google Chat status',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/integrations/telegram/test
 * @desc    Send test message to Telegram
 * @access  Private
 */
export const sendTelegramTest = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.telegramId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram account is not linked',
      });
    }

    const success = await sendTelegramMessage(
      user.telegramId,
      `🧪 Test Message\n\nThis is a test message from Daily Update.\nYour Telegram integration is working correctly! ✅`
    );

    if (success) {
      res.json({
        success: true,
        message: 'Test message sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test message',
      });
    }
  } catch (error) {
    console.error('Send Telegram test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test message',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/integrations/googlechat/test
 * @desc    Send test message to Google Chat
 * @access  Private
 */
export const sendGoogleChatTest = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+googleChatWebhook');

    if (!user.googleChatWebhook) {
      return res.status(400).json({
        success: false,
        message: 'Google Chat webhook is not linked',
      });
    }

    const success = await sendGoogleChatMessage(
      user.googleChatWebhook,
      `🧪 *Test Message*\n\nThis is a test message from Daily Update.\nYour Google Chat integration is working correctly! ✅`
    );

    if (success) {
      res.json({
        success: true,
        message: 'Test message sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test message',
      });
    }
  } catch (error) {
    console.error('Send Google Chat test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test message',
      error: error.message,
    });
  }
};
