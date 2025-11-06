import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  sendVerification,
  verifyEmail
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Public Routes
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, forgotPassword);
router.put('/reset-password/:resetToken', authLimiter, resetPasswordValidation, resetPassword);
router.get('/verify-email/:verificationToken', verifyEmail);

// Protected Routes
router.get('/me', protect, getMe);
router.post('/send-verification', protect, authLimiter, sendVerification);

export default router;
