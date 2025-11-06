import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * Auth rate limiter
 * Limits: 5 requests per 15 minutes per IP (stricter for auth endpoints)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register attempts per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * AI Generation rate limiter
 * Limits: 10 requests per minute per IP (AI calls are expensive)
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 AI generations per minute
  message: {
    success: false,
    message: 'Too many AI generation requests, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for sensitive operations
 * Limits: 3 requests per hour per IP
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Rate limit exceeded for this operation'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Export rate limiter
 * Limits: 10 requests per 15 minutes (prevent export abuse)
 */
export const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many export requests, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password reset rate limiter
 * Limits: 3 requests per hour (very restrictive to prevent abuse)
 */
export const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after an hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
