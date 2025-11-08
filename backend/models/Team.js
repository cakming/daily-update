import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a team name'],
    trim: true,
    maxlength: [100, 'Team name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  members: [teamMemberSchema],
  settings: {
    visibility: {
      type: String,
      enum: ['private', 'public'],
      default: 'private'
    },
    allowMemberInvites: {
      type: Boolean,
      default: false
    }
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
teamSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
teamSchema.index({ owner: 1, createdAt: -1 });
teamSchema.index({ 'members.userId': 1 });
teamSchema.index({ name: 1 });

// Method to check if user is a member
teamSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.userId.toString() === userId.toString());
};

// Method to check if user is admin or owner
teamSchema.methods.isAdminOrOwner = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  const member = this.members.find(m => m.userId.toString() === userId.toString());
  return member && (member.role === 'admin' || member.role === 'owner');
};

// Method to get user role in team
teamSchema.methods.getUserRole = function(userId) {
  if (this.owner.toString() === userId.toString()) return 'owner';
  const member = this.members.find(m => m.userId.toString() === userId.toString());
  return member ? member.role : null;
};

const Team = mongoose.model('Team', teamSchema);

export default Team;
