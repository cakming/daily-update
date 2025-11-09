/**
 * Email Service
 *
 * NOTE: This is a console-based email service for development.
 * For production, configure with SendGrid, Mailgun, or AWS SES.
 *
 * To configure SendGrid:
 * 1. npm install @sendgrid/mail
 * 2. Set SENDGRID_API_KEY in .env
 * 3. Uncomment SendGrid code below
 */

// For SendGrid (uncomment and configure):
// import sgMail from '@sendgrid/mail';
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.resetUrl - Password reset URL
 * @param {string} options.name - User's name
 */
export const sendPasswordResetEmail = async ({ email, resetUrl, name }) => {
  const subject = 'Password Reset Request';
  const message = `
Hi ${name},

You requested to reset your password for your Daily Update App account.

Click the link below to reset your password (valid for 1 hour):
${resetUrl}

If you didn't request this, please ignore this email.

Thanks,
Daily Update App Team
  `.trim();

  // Console logging for development
  console.log('\n' + '='.repeat(60));
  console.log('📧 EMAIL SENT (Development Mode)');
  console.log('='.repeat(60));
  console.log('To:', email);
  console.log('Subject:', subject);
  console.log('\nMessage:');
  console.log(message);
  console.log('='.repeat(60) + '\n');

  // For production with SendGrid:
  // const msg = {
  //   to: email,
  //   from: process.env.FROM_EMAIL || 'noreply@dailyupdate.app',
  //   subject,
  //   text: message,
  //   html: message.replace(/\n/g, '<br>'),
  // };
  // await sgMail.send(msg);

  return { success: true, message: 'Email sent (console)' };
};

/**
 * Send email verification email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.verifyUrl - Email verification URL
 * @param {string} options.name - User's name
 */
export const sendEmailVerification = async ({ email, verifyUrl, name }) => {
  const subject = 'Verify Your Email Address';
  const message = `
Hi ${name},

Welcome to Daily Update App!

Please verify your email address by clicking the link below (valid for 24 hours):
${verifyUrl}

If you didn't create this account, please ignore this email.

Thanks,
Daily Update App Team
  `.trim();

  // Console logging for development
  console.log('\n' + '='.repeat(60));
  console.log('📧 EMAIL SENT (Development Mode)');
  console.log('='.repeat(60));
  console.log('To:', email);
  console.log('Subject:', subject);
  console.log('\nMessage:');
  console.log(message);
  console.log('='.repeat(60) + '\n');

  // For production with SendGrid:
  // const msg = {
  //   to: email,
  //   from: process.env.FROM_EMAIL || 'noreply@dailyupdate.app',
  //   subject,
  //   text: message,
  //   html: message.replace(/\n/g, '<br>'),
  // };
  // await sgMail.send(msg);

  return { success: true, message: 'Email sent (console)' };
};

/**
 * Send welcome email (after email verification)
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.name - User's name
 */
export const sendWelcomeEmail = async ({ email, name }) => {
  const subject = 'Welcome to Daily Update App!';
  const message = `
Hi ${name},

Your email has been verified successfully!

You can now enjoy all features of Daily Update App:
- AI-powered update formatting
- Multiple export formats
- Company/client management
- Analytics and insights

Get started: ${process.env.CLIENT_URL || 'http://localhost:3000'}

Thanks,
Daily Update App Team
  `.trim();

  // Console logging for development
  console.log('\n' + '='.repeat(60));
  console.log('📧 EMAIL SENT (Development Mode)');
  console.log('='.repeat(60));
  console.log('To:', email);
  console.log('Subject:', subject);
  console.log('\nMessage:');
  console.log(message);
  console.log('='.repeat(60) + '\n');

  // For production with SendGrid:
  // const msg = {
  //   to: email,
  //   from: process.env.FROM_EMAIL || 'noreply@dailyupdate.app',
  //   subject,
  //   text: message,
  //   html: message.replace(/\n/g, '<br>'),
  // };
  // await sgMail.send(msg);

  return { success: true, message: 'Email sent (console)' };
};
