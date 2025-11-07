import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      trim: true,
      maxlength: [50, 'Tag name cannot exceed 50 characters']
    },
    color: {
      type: String,
      default: '#3182CE'
    },
    category: {
      type: String,
      enum: ['project', 'priority', 'status', 'custom'],
      default: 'custom'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    usageCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Compound index for unique tags per user
tagSchema.index({ userId: 1, name: 1 }, { unique: true });

// Method to increment usage count
tagSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  await this.save();
};

const Tag = mongoose.model('Tag', tagSchema);

export default Tag;
