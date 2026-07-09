import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';

// --- Mock the email service so no real mail is ever sent ---
const mockSendPasswordResetEmail = jest.fn();
const mockSendEmailVerification = jest.fn();
const mockSendWelcomeEmail = jest.fn();

jest.unstable_mockModule('../../../services/emailService.js', () => ({
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  sendEmailVerification: mockSendEmailVerification,
  sendWelcomeEmail: mockSendWelcomeEmail,
}));

// --- Mock the upload middleware so no real filesystem writes/deletes happen ---
const mockDeleteAvatarFile = jest.fn();

jest.unstable_mockModule('../../../middleware/upload.js', () => ({
  deleteAvatarFile: mockDeleteAvatarFile,
  uploadAvatar: {},
}));

// Dynamic imports AFTER registering mocks
const {
  forgotPassword,
  resetPassword,
  sendVerification,
  verifyEmail,
  updateProfile,
  uploadUserAvatar,
  deleteUserAvatar,
} = await import('../../../controllers/authController.js');
const { default: User } = await import('../../../models/User.js');

describe('Auth Controller (extra functions)', () => {
  let mockReq;
  let mockRes;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    mockReq = { body: {}, params: {}, user: null, file: null };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockSendPasswordResetEmail.mockResolvedValue({ success: true });
    mockSendEmailVerification.mockResolvedValue({ success: true });
    mockSendWelcomeEmail.mockResolvedValue({ success: true });
  });

  afterEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  const createUser = async (overrides = {}) =>
    User.create(createUserFixture({ email: 'user@example.com', password: 'password123', ...overrides }));

  describe('forgotPassword', () => {
    it('should return 400 when no email is provided', async () => {
      mockReq.body = {};

      await forgotPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Please provide an email address' })
      );
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should return a generic success message when the user does not exist (no email sent)', async () => {
      mockReq.body = { email: 'nobody@example.com' };

      await forgotPassword(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should generate a reset token, persist it and send the email when the user exists', async () => {
      const user = await createUser();
      mockReq.body = { email: user.email };

      await forgotPassword(mockReq, mockRes);

      expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: user.email, name: user.name, resetUrl: expect.stringContaining('/reset-password/') })
      );
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

      const saved = await User.findById(user._id).select('+resetPasswordToken +resetPasswordExpire');
      expect(saved.resetPasswordToken).toBeDefined();
      expect(saved.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now());
    });

    it('should clear the reset token and return 500 when the email fails to send', async () => {
      const user = await createUser();
      mockReq.body = { email: user.email };
      mockSendPasswordResetEmail.mockRejectedValueOnce(new Error('smtp down'));

      await forgotPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Email could not be sent' })
      );

      const saved = await User.findById(user._id).select('+resetPasswordToken +resetPasswordExpire');
      expect(saved.resetPasswordToken).toBeUndefined();
      expect(saved.resetPasswordExpire).toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    it('should return 400 when password is missing or too short', async () => {
      mockReq.body = { password: '123' };
      mockReq.params = { resetToken: 'whatever' };

      await resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining('at least 6 characters') })
      );
    });

    it('should reset the password with a valid token and return a login token', async () => {
      const user = await createUser();
      const rawToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });

      mockReq.params = { resetToken: rawToken };
      mockReq.body = { password: 'brandnewpass123' };

      await resetPassword(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Password reset successful',
          data: expect.objectContaining({ token: expect.any(String) }),
        })
      );

      // Token fields should be cleared and the new password should work
      const updated = await User.findById(user._id).select('+password +resetPasswordToken');
      expect(updated.resetPasswordToken).toBeUndefined();
      expect(await updated.comparePassword('brandnewpass123')).toBe(true);
    });

    it('should return 400 for an invalid / expired reset token', async () => {
      const user = await createUser();
      user.getResetPasswordToken();
      // Force expiry into the past
      user.resetPasswordExpire = Date.now() - 1000;
      await user.save({ validateBeforeSave: false });

      mockReq.params = { resetToken: 'not-the-real-token' };
      mockReq.body = { password: 'brandnewpass123' };

      await resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Invalid or expired reset token' })
      );
    });
  });

  describe('sendVerification', () => {
    it('should return 404 when the user no longer exists', async () => {
      mockReq.user = { _id: new mongoose.Types.ObjectId() };

      await sendVerification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 when the email is already verified', async () => {
      const user = await createUser({ emailVerified: true });
      mockReq.user = { _id: user._id };

      await sendVerification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Email is already verified' })
      );
      expect(mockSendEmailVerification).not.toHaveBeenCalled();
    });

    it('should generate a token and send the verification email', async () => {
      const user = await createUser();
      mockReq.user = { _id: user._id };

      await sendVerification(mockReq, mockRes);

      expect(mockSendEmailVerification).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Verification email sent' })
      );

      const saved = await User.findById(user._id).select('+emailVerificationToken +emailVerificationExpire');
      expect(saved.emailVerificationToken).toBeDefined();
      expect(saved.emailVerificationExpire.getTime()).toBeGreaterThan(Date.now());
    });

    it('should clear the token and return 500 when the email fails to send', async () => {
      const user = await createUser();
      mockReq.user = { _id: user._id };
      mockSendEmailVerification.mockRejectedValueOnce(new Error('smtp down'));

      await sendVerification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      const saved = await User.findById(user._id).select('+emailVerificationToken');
      expect(saved.emailVerificationToken).toBeUndefined();
    });
  });

  describe('verifyEmail', () => {
    it('should verify the email with a valid token and send a welcome email', async () => {
      const user = await createUser();
      const rawToken = user.getEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      mockReq.params = { verificationToken: rawToken };

      await verifyEmail(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Email verified successfully',
          data: expect.objectContaining({ emailVerified: true }),
        })
      );
      expect(mockSendWelcomeEmail).toHaveBeenCalledTimes(1);

      const updated = await User.findById(user._id);
      expect(updated.emailVerified).toBe(true);
    });

    it('should return 400 for an invalid / expired verification token', async () => {
      mockReq.params = { verificationToken: 'bogus-token' };

      await verifyEmail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Invalid or expired verification token' })
      );
      expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update the name successfully', async () => {
      const user = await createUser({ name: 'Old Name' });
      mockReq.user = { _id: user._id };
      mockReq.body = { name: '  New Name  ' };

      await updateProfile(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ name: 'New Name' }),
        })
      );
    });

    it('should change the password when the current password is correct', async () => {
      const user = await createUser({ password: 'password123' });
      mockReq.user = { _id: user._id };
      mockReq.body = { currentPassword: 'password123', newPassword: 'freshpass456' };

      await updateProfile(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      const updated = await User.findById(user._id).select('+password');
      expect(await updated.comparePassword('freshpass456')).toBe(true);
    });

    it('should return 400 when newPassword is provided without currentPassword', async () => {
      const user = await createUser();
      mockReq.user = { _id: user._id };
      mockReq.body = { newPassword: 'freshpass456' };

      await updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 when the current password is incorrect', async () => {
      const user = await createUser({ password: 'password123' });
      mockReq.user = { _id: user._id };
      mockReq.body = { currentPassword: 'wrongpass', newPassword: 'freshpass456' };

      await updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Current password is incorrect' })
      );
    });

    it('should return 400 when the new password is too short', async () => {
      const user = await createUser({ password: 'password123' });
      mockReq.user = { _id: user._id };
      mockReq.body = { currentPassword: 'password123', newPassword: '123' };

      await updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when the new email is already in use', async () => {
      await createUser({ email: 'taken@example.com' });
      const user = await createUser({ email: 'me@example.com' });
      mockReq.user = { _id: user._id };
      mockReq.body = { email: 'taken@example.com' };

      await updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Email is already in use' })
      );
    });

    it('should change the email and require re-verification', async () => {
      const user = await createUser({ email: 'me@example.com', emailVerified: true });
      mockReq.user = { _id: user._id };
      mockReq.body = { email: 'newemail@example.com' };

      await updateProfile(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ email: 'newemail@example.com', emailVerified: false }),
        })
      );
    });

    it('should return 404 when the user does not exist', async () => {
      mockReq.user = { _id: new mongoose.Types.ObjectId() };
      mockReq.body = { name: 'Whatever' };

      await updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('uploadUserAvatar', () => {
    it('should return 400 when no file is uploaded', async () => {
      const user = await createUser();
      mockReq.user = { _id: user._id };
      mockReq.file = null;

      await uploadUserAvatar(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Please upload an image file' })
      );
    });

    it('should save the avatar filename on success', async () => {
      const user = await createUser();
      mockReq.user = { _id: user._id };
      mockReq.file = { filename: 'avatar-123.png' };

      await uploadUserAvatar(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ avatar: 'avatar-123.png', avatarUrl: '/uploads/avatars/avatar-123.png' }),
        })
      );
      expect(mockDeleteAvatarFile).not.toHaveBeenCalled();

      const updated = await User.findById(user._id);
      expect(updated.avatar).toBe('avatar-123.png');
    });

    it('should delete the previous avatar file when replacing an existing avatar', async () => {
      const user = await createUser({ avatar: 'old-avatar.png' });
      mockReq.user = { _id: user._id };
      mockReq.file = { filename: 'new-avatar.png' };

      await uploadUserAvatar(mockReq, mockRes);

      expect(mockDeleteAvatarFile).toHaveBeenCalledWith('old-avatar.png');
      const updated = await User.findById(user._id);
      expect(updated.avatar).toBe('new-avatar.png');
    });

    it('should return 404 when the user does not exist', async () => {
      mockReq.user = { _id: new mongoose.Types.ObjectId() };
      mockReq.file = { filename: 'x.png' };

      await uploadUserAvatar(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteUserAvatar', () => {
    it('should delete the avatar file and clear the avatar field', async () => {
      const user = await createUser({ avatar: 'to-delete.png' });
      mockReq.user = { _id: user._id };

      await deleteUserAvatar(mockReq, mockRes);

      expect(mockDeleteAvatarFile).toHaveBeenCalledWith('to-delete.png');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Avatar deleted successfully' })
      );

      const updated = await User.findById(user._id);
      expect(updated.avatar).toBeNull();
    });

    it('should return 400 when there is no avatar to delete', async () => {
      const user = await createUser();
      mockReq.user = { _id: user._id };

      await deleteUserAvatar(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'No avatar to delete' })
      );
      expect(mockDeleteAvatarFile).not.toHaveBeenCalled();
    });

    it('should return 404 when the user does not exist', async () => {
      mockReq.user = { _id: new mongoose.Types.ObjectId() };

      await deleteUserAvatar(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
