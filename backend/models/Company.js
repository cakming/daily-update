import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  color: {
    type: String,
    default: '#3182CE', // Default blue color for UI
    match: [/^#([A-Fa-f0-9]{6})$/, 'Please provide a valid hex color code']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
companySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create compound index for userId and name (prevent duplicate company names per user)
companySchema.index({ userId: 1, name: 1 }, { unique: true });

// Create index for efficient queries
companySchema.index({ userId: 1, isActive: 1 });
companySchema.index({ userId: 1, createdAt: -1 });

// Virtual for getting update count (can be populated if needed)
companySchema.virtual('updateCount', {
  ref: 'Update',
  localField: '_id',
  foreignField: 'companyId',
  count: true
});

const Company = mongoose.model('Company', companySchema);

export default Company;
