import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import dailyUpdateRoutes from './routes/dailyUpdates.js';
import weeklyUpdateRoutes from './routes/weeklyUpdates.js';
import companyRoutes from './routes/companies.js';
import exportRoutes from './routes/export.js';
import analyticsRoutes from './routes/analytics.js';
import templateRoutes from './routes/templates.js';
import tagRoutes from './routes/tags.js';
import bulkRoutes from './routes/bulk.js';
import { apiLimiter, authLimiter, aiLimiter, exportLimiter } from './middleware/rateLimiter.js';
import {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
} from './config/sentry.js';

// Initialize Express app
const app = express();

// Initialize Sentry (must be first)
initSentry(app);

// Sentry request handler (must be before other middleware)
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/daily-updates', aiLimiter, dailyUpdateRoutes);
app.use('/api/weekly-updates', aiLimiter, weeklyUpdateRoutes);
app.use('/api/export', exportLimiter, exportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/bulk', bulkRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Daily Update API is running',
    timestamp: new Date().toISOString()
  });
});

// Sentry error handler (must be after routes, before other error handlers)
app.use(sentryErrorHandler());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

export default app;
