import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [100, 'Template name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Template content is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily',
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
templateSchema.index({ userId: 1, isActive: 1, type: 1 });
templateSchema.index({ userId: 1, name: 1 });

// Increment usage count
templateSchema.methods.incrementUsage = async function () {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  await this.save();
};

const Template = mongoose.model('Template', templateSchema);

export default Template;
