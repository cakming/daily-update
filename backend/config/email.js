import nodemailer from 'nodemailer';
import { formatUpdate } from '../services/updateFormatter.js';

/**
 * Email Configuration
 * Handles email transport setup and configuration
 */

// Create reusable transporter
let transporter = null;

/**
 * Get email transporter (singleton pattern)
 */
export const getTransporter = () => {
  if (!transporter) {
    // Check if email is configured
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email not configured. Email sending will be disabled.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }

  return transporter;
};

/**
 * Verify email configuration
 */
export const verifyEmailConfig = async () => {
  const transport = getTransporter();

  if (!transport) {
    return { success: false, message: 'Email not configured' };
  }

  try {
    await transport.verify();
    console.log('Email server is ready to send messages');
    return { success: true, message: 'Email configuration verified' };
  } catch (error) {
    console.error('Email configuration error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Email templates
 */
export const emailTemplates = {
  /**
   * Daily update email template
   */
  dailyUpdate: (update, user, options = {}) => {
    const view = formatUpdate(update, options);
    const companyName = view.companyLabel;
    const date = new Date(view.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      subject: `Daily Update - ${companyName} - ${date}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background-color: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              border-bottom: 3px solid #3182CE;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #3182CE;
              font-size: 24px;
            }
            .meta {
              color: #666;
              font-size: 14px;
              margin-top: 10px;
            }
            .meta strong {
              color: #333;
            }
            .content {
              margin: 20px 0;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .summary {
              background-color: #EBF8FF;
              border-left: 4px solid #3182CE;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .summary h3 {
              margin-top: 0;
              color: #2C5282;
            }
            .tags {
              margin: 20px 0;
            }
            .tag {
              display: inline-block;
              background-color: #E6FFFA;
              color: #234E52;
              padding: 5px 10px;
              border-radius: 4px;
              margin-right: 5px;
              margin-bottom: 5px;
              font-size: 12px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Daily Update</h1>
              <div class="meta">
                <strong>Company:</strong> ${companyName}<br>
                <strong>Date:</strong> ${date}<br>
                <strong>From:</strong> ${user.name} (${user.email})
              </div>
            </div>

            <div class="content">
              <h3>Update Content:</h3>
              <p>${view.body}</p>
            </div>

            ${view.tags.length > 0 ? `
            <div class="tags">
              <strong>Tags:</strong><br>
              ${view.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            ` : ''}

            <div class="footer">
              <p>This email was sent from Daily Update App</p>
              <p>© ${new Date().getFullYear()} Daily Update. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Daily Update - ${companyName} - ${date}

Company: ${companyName}
Date: ${date}
From: ${user.name} (${user.email})

Update Content:
${view.body}

${view.tags.length > 0 ? `\nTags: ${view.tags.join(', ')}` : ''}

---
This email was sent from Daily Update App
© ${new Date().getFullYear()} Daily Update. All rights reserved.
      `.trim(),
    };
  },

  /**
   * Weekly summary email template
   */
  weeklySummary: (update, user, options = {}) => {
    const view = formatUpdate(update, options);
    const companyName = view.companyLabel;
    const startDate = new Date(view.dateRange?.start).toLocaleDateString();
    const endDate = new Date(view.dateRange?.end).toLocaleDateString();

    return {
      subject: `Weekly Summary - ${companyName} - ${startDate} to ${endDate}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background-color: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              border-bottom: 3px solid #38A169;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #38A169;
              font-size: 24px;
            }
            .meta {
              color: #666;
              font-size: 14px;
              margin-top: 10px;
            }
            .meta strong {
              color: #333;
            }
            .content {
              margin: 20px 0;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .summary {
              background-color: #F0FFF4;
              border-left: 4px solid #38A169;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .summary h3 {
              margin-top: 0;
              color: #276749;
            }
            .stats {
              background-color: #EBF8FF;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
            }
            .stats strong {
              color: #2C5282;
            }
            .tags {
              margin: 20px 0;
            }
            .tag {
              display: inline-block;
              background-color: #E6FFFA;
              color: #234E52;
              padding: 5px 10px;
              border-radius: 4px;
              margin-right: 5px;
              margin-bottom: 5px;
              font-size: 12px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Weekly Summary</h1>
              <div class="meta">
                <strong>Company:</strong> ${companyName}<br>
                <strong>Period:</strong> ${startDate} - ${endDate}<br>
                <strong>From:</strong> ${user.name} (${user.email})
              </div>
            </div>

            <div class="stats">
              <strong>📈 Statistics</strong><br>
              Updates Included: ${view.dailyUpdatesCount}
            </div>

            <div class="content">
              <h3>Weekly Summary:</h3>
              <p>${view.body}</p>
            </div>

            ${view.tags.length > 0 ? `
            <div class="tags">
              <strong>Tags:</strong><br>
              ${view.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            ` : ''}

            <div class="footer">
              <p>This email was sent from Daily Update App</p>
              <p>© ${new Date().getFullYear()} Daily Update. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Weekly Summary - ${companyName} - ${startDate} to ${endDate}

Company: ${companyName}
Period: ${startDate} - ${endDate}
From: ${user.name} (${user.email})

Statistics:
Updates Included: ${view.dailyUpdatesCount}

Weekly Summary:
${view.body}

${view.tags.length > 0 ? `\nTags: ${view.tags.join(', ')}` : ''}

---
This email was sent from Daily Update App
© ${new Date().getFullYear()} Daily Update. All rights reserved.
      `.trim(),
    };
  },

  /**
   * Digest email template — a roll-up of several updates.
   * @param {'daily'|'weekly'} period
   * @param {Array} updates - populated Update docs
   * @param {object} user
   * @param {object} [options] - { summaryMode }
   */
  digest: (period, updates, user, options = {}) => {
    const label = period === 'daily' ? 'Daily' : 'Weekly';
    const heading = period === 'daily' ? '🗞️ Your Daily Digest' : '🗞️ Your Weekly Digest';

    const items = updates.map((update) => {
      const view = formatUpdate(update, options);
      const when = view.date
        ? new Date(view.date).toLocaleDateString()
        : view.dateRange?.start
        ? `${new Date(view.dateRange.start).toLocaleDateString()} – ${new Date(view.dateRange.end).toLocaleDateString()}`
        : '';
      return { view, when };
    });

    const itemsHtml = items
      .map(
        ({ view, when }) => `
        <div style="border-left:3px solid #3182CE;padding:8px 14px;margin:14px 0;background:#F7FAFC;border-radius:4px;">
          <div style="font-size:13px;color:#666;">
            <strong>${view.title}</strong> · ${view.companyLabel}${when ? ` · ${when}` : ''}
          </div>
          <div style="margin-top:6px;white-space:pre-wrap;">${view.body}</div>
        </div>`
      )
      .join('');

    const itemsText = items
      .map(({ view, when }) => `• ${view.title} — ${view.companyLabel}${when ? ` (${when})` : ''}\n${view.body}\n`)
      .join('\n');

    return {
      subject: `${label} Digest — ${updates.length} update${updates.length === 1 ? '' : 's'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family:'Segoe UI',Tahoma,sans-serif;line-height:1.6;color:#333;max-width:640px;margin:0 auto;padding:20px;background:#f5f5f5;">
          <div style="background:#fff;border-radius:8px;padding:28px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color:#3182CE;font-size:22px;margin-top:0;">${heading}</h1>
            <p style="color:#666;font-size:14px;">Hi ${user.name}, here ${updates.length === 1 ? 'is' : 'are'} your ${updates.length} update${updates.length === 1 ? '' : 's'} from the past ${period === 'daily' ? 'day' : 'week'}.</p>
            ${itemsHtml}
            <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e0e0e0;text-align:center;color:#666;font-size:12px;">
              <p>You're receiving this because ${period} digests are enabled in your notification settings.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `${heading}\n\nHi ${user.name}, here are your ${updates.length} update(s) from the past ${period === 'daily' ? 'day' : 'week'}:\n\n${itemsText}\n---\nYou're receiving this because ${period} digests are enabled in your notification settings.`,
    };
  },
};

export default {
  getTransporter,
  verifyEmailConfig,
  emailTemplates,
};
