import express from 'express';
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getCompanyStats
} from '../controllers/companyController.js';
import { protect } from '../middleware/auth.js';
import { strictLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Company CRUD routes
router.post('/', strictLimiter, createCompany);
router.get('/', getAllCompanies);
router.get('/:id', getCompanyById);
router.put('/:id', strictLimiter, updateCompany);
router.delete('/:id', strictLimiter, deleteCompany);

// Company statistics
router.get('/:id/stats', getCompanyStats);

export default router;
