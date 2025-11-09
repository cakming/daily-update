import User from '../models/User.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * @desc    Generate 2FA secret and QR code
 * @route   POST /api/auth/2fa/setup
 * @access  Private
 */
export const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled for your account'
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Daily Update (${user.email})`,
      issuer: 'Daily Update App'
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Save secret (but don't enable 2FA yet)
    user.twoFactorSecret = secret.base32;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Scan this QR code with your authenticator app',
      data: {
        secret: secret.base32,
        qrCode
      }
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup 2FA',
      error: error.message
    });
  }
};

/**
 * @desc    Verify and enable 2FA
 * @route   POST /api/auth/2fa/verify
 * @access  Private
 */
export const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a verification token'
      });
    }

    const user = await User.findById(req.user._id).select('+twoFactorSecret +twoFactorBackupCodes');

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Please set up 2FA first using the setup endpoint'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after for clock skew
    });

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification code. Please try again.'
      });
    }

    // Generate backup codes (10 codes)
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = backupCodes;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: '2FA enabled successfully! Save your backup codes in a safe place.',
      data: {
        backupCodes
      }
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA token',
      error: error.message
    });
  }
};

/**
 * @desc    Disable 2FA
 * @route   POST /api/auth/2fa/disable
 * @access  Private
 */
export const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password to disable 2FA'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: '2FA has been disabled for your account'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA',
      error: error.message
    });
  }
};

/**
 * @desc    Get 2FA status
 * @route   GET /api/auth/2fa/status
 * @access  Private
 */
export const get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        twoFactorEnabled: user.twoFactorEnabled || false
      }
    });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status',
      error: error.message
    });
  }
};
