import mongoose from 'mongoose';

const updateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false,
    index: true
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  type: {
    type: String,
    enum: ['daily', 'weekly'],
    required: true
  },
  date: {
    type: Date,
    required: function() {
      return this.type === 'daily';
    }
  },
  dateRange: {
    start: {
      type: Date,
      required: function() {
        return this.type === 'weekly';
      }
    },
    end: {
      type: Date,
      required: function() {
        return this.type === 'weekly';
      }
    }
  },
  rawInput: {
    type: String,
    required: true
  },
  formattedOutput: {
    type: String,
    required: true
  },
  sections: {
    todaysProgress: [String],
    ongoingWork: [String],
    nextSteps: [String],
    issues: [String]
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
updateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
updateSchema.index({ userId: 1, type: 1, date: -1 });
updateSchema.index({ userId: 1, createdAt: -1 });
updateSchema.index({ userId: 1, companyId: 1, date: -1 });
updateSchema.index({ companyId: 1, createdAt: -1 });

const Update = mongoose.model('Update', updateSchema);

export default Update;
