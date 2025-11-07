import { getTransporter, emailTemplates, verifyEmailConfig } from '../config/email.js';
import DailyUpdate from '../models/DailyUpdate.js';
import WeeklyUpdate from '../models/WeeklyUpdate.js';
import User from '../models/User.js';

/**
 * Email Controller
 * Handles sending emails for daily and weekly updates
 */

/**
 * @route   POST /api/email/daily/:id
 * @desc    Send daily update via email
 * @access  Private
 */
export const sendDailyUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipients } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one recipient email address',
      });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter((email) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid email addresses: ${invalidEmails.join(', ')}`,
      });
    }

    // Get transporter
    const transporter = getTransporter();
    if (!transporter) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Please contact the administrator.',
      });
    }

    // Get daily update
    const update = await DailyUpdate.findById(id)
      .populate('company')
      .populate('tags');

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Daily update not found',
      });
    }

    // Check ownership
    if (update.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send this update',
      });
    }

    // Get user
    const user = await User.findById(req.user._id);

    // Generate email content
    const emailContent = emailTemplates.dailyUpdate(update, user);

    // Send email to all recipients
    const sendPromises = recipients.map((recipient) =>
      transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Daily Update'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: recipient,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      })
    );

    await Promise.all(sendPromises);

    res.json({
      success: true,
      message: `Daily update sent to ${recipients.length} recipient(s)`,
      data: {
        recipients,
        updateId: id,
      },
    });
  } catch (error) {
    console.error('Send daily update email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/email/weekly/:id
 * @desc    Send weekly summary via email
 * @access  Private
 */
export const sendWeeklySummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipients } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one recipient email address',
      });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter((email) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid email addresses: ${invalidEmails.join(', ')}`,
      });
    }

    // Get transporter
    const transporter = getTransporter();
    if (!transporter) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Please contact the administrator.',
      });
    }

    // Get weekly update
    const update = await WeeklyUpdate.findById(id)
      .populate('company')
      .populate('tags')
      .populate('dailyUpdates');

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Weekly summary not found',
      });
    }

    // Check ownership
    if (update.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send this update',
      });
    }

    // Get user
    const user = await User.findById(req.user._id);

    // Generate email content
    const emailContent = emailTemplates.weeklySummary(update, user);

    // Send email to all recipients
    const sendPromises = recipients.map((recipient) =>
      transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Daily Update'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: recipient,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      })
    );

    await Promise.all(sendPromises);

    res.json({
      success: true,
      message: `Weekly summary sent to ${recipients.length} recipient(s)`,
      data: {
        recipients,
        updateId: id,
      },
    });
  } catch (error) {
    console.error('Send weekly summary email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/email/config-status
 * @desc    Check email configuration status
 * @access  Private
 */
export const getEmailConfigStatus = async (req, res) => {
  try {
    const result = await verifyEmailConfig();

    res.json({
      success: true,
      data: {
        configured: result.success,
        message: result.message,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify email configuration',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/email/test
 * @desc    Send a test email
 * @access  Private
 */
export const sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    const transporter = getTransporter();
    if (!transporter) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured',
      });
    }

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Daily Update'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Test Email from Daily Update App',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email</h2>
          <p>This is a test email from Daily Update App.</p>
          <p>If you received this email, your email configuration is working correctly!</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Sent on ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: `Test Email from Daily Update App\n\nThis is a test email. If you received this, your email configuration is working correctly!\n\nSent on ${new Date().toLocaleString()}`,
    });

    res.json({
      success: true,
      message: `Test email sent to ${email}`,
    });
  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
    });
  }
};
