import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// emailService.js is a console-based development email service. It does not
// import nodemailer directly, but we still register a harmless mock so that no
// real transport could ever be created if the implementation changes, and to
// mirror the mock-before-import pattern used elsewhere in the suite.
jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }) })),
  },
}));

const { sendPasswordResetEmail, sendEmailVerification, sendWelcomeEmail } = await import(
  '../../../services/emailService.js'
);

describe('Email Service', () => {
  let logSpy;

  // Helper: concatenate every console.log call into a single searchable string.
  const loggedText = () => logSpy.mock.calls.map((args) => args.join(' ')).join('\n');

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('sendPasswordResetEmail', () => {
    it('should return success result', async () => {
      const result = await sendPasswordResetEmail({
        email: 'alice@example.com',
        resetUrl: 'https://app.test/reset?token=abc',
        name: 'Alice',
      });

      expect(result).toEqual({ success: true, message: 'Email sent (console)' });
    });

    it('should log recipient, subject and message details', async () => {
      await sendPasswordResetEmail({
        email: 'alice@example.com',
        resetUrl: 'https://app.test/reset?token=abc',
        name: 'Alice',
      });

      const text = loggedText();
      expect(logSpy).toHaveBeenCalled();
      // Recipient is logged as a separate arg pair ('To:', email).
      expect(logSpy).toHaveBeenCalledWith('To:', 'alice@example.com');
      expect(logSpy).toHaveBeenCalledWith('Subject:', 'Password Reset Request');
      expect(text).toContain('Hi Alice,');
      expect(text).toContain('https://app.test/reset?token=abc');
      expect(text).toContain('valid for 1 hour');
    });
  });

  describe('sendEmailVerification', () => {
    it('should return success result', async () => {
      const result = await sendEmailVerification({
        email: 'bob@example.com',
        verifyUrl: 'https://app.test/verify?token=xyz',
        name: 'Bob',
      });

      expect(result).toEqual({ success: true, message: 'Email sent (console)' });
    });

    it('should log verification subject, url and greeting', async () => {
      await sendEmailVerification({
        email: 'bob@example.com',
        verifyUrl: 'https://app.test/verify?token=xyz',
        name: 'Bob',
      });

      const text = loggedText();
      expect(logSpy).toHaveBeenCalledWith('To:', 'bob@example.com');
      expect(logSpy).toHaveBeenCalledWith('Subject:', 'Verify Your Email Address');
      expect(text).toContain('Hi Bob,');
      expect(text).toContain('https://app.test/verify?token=xyz');
      expect(text).toContain('valid for 24 hours');
    });
  });

  describe('sendWelcomeEmail', () => {
    const originalClientUrl = process.env.CLIENT_URL;

    afterEach(() => {
      if (originalClientUrl === undefined) {
        delete process.env.CLIENT_URL;
      } else {
        process.env.CLIENT_URL = originalClientUrl;
      }
    });

    it('should return success result', async () => {
      const result = await sendWelcomeEmail({ email: 'carol@example.com', name: 'Carol' });
      expect(result).toEqual({ success: true, message: 'Email sent (console)' });
    });

    it('should use CLIENT_URL env var when set (branch: env present)', async () => {
      process.env.CLIENT_URL = 'https://production.example.com';

      await sendWelcomeEmail({ email: 'carol@example.com', name: 'Carol' });

      const text = loggedText();
      expect(logSpy).toHaveBeenCalledWith('Subject:', 'Welcome to Daily Update App!');
      expect(text).toContain('Hi Carol,');
      expect(text).toContain('https://production.example.com');
      expect(text).not.toContain('http://localhost:3000');
    });

    it('should fall back to localhost when CLIENT_URL absent (branch: env missing)', async () => {
      delete process.env.CLIENT_URL;

      await sendWelcomeEmail({ email: 'carol@example.com', name: 'Carol' });

      const text = loggedText();
      expect(text).toContain('http://localhost:3000');
    });
  });
});
