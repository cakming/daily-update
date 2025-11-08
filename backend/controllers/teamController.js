import Team from '../models/Team.js';
import Update from '../models/Update.js';
import User from '../models/User.js';

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
export const createTeam = async (req, res) => {
  try {
    const { name, description, settings } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a team name'
      });
    }

    // Create team with owner
    const team = await Team.create({
      name,
      description,
      owner: req.user._id,
      members: [{
        userId: req.user._id,
        role: 'owner',
        joinedAt: new Date()
      }],
      settings: settings || {}
    });

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating team'
    });
  }
};

// @desc    Get all teams for current user
// @route   GET /api/teams
// @access  Private
export const getTeams = async (req, res) => {
  try {
    // Find teams where user is a member
    const teams = await Team.find({
      $or: [
        { owner: req.user._id },
        { 'members.userId': req.user._id }
      ]
    })
    .populate('owner', 'name email')
    .populate('members.userId', 'name email')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teams'
    });
  }
};

// @desc    Get single team by ID
// @route   GET /api/teams/:id
// @access  Private
export const getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.userId', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member
    if (!team.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this team'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team'
    });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Admin/Owner only)
export const updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is admin or owner
    if (!team.isAdminOrOwner(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this team'
      });
    }

    const { name, description, settings } = req.body;

    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (settings) team.settings = { ...team.settings, ...settings };

    await team.save();

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating team'
    });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Owner only)
export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is owner
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team owner can delete the team'
      });
    }

    await Team.deleteOne({ _id: team._id });

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting team'
    });
  }
};

// @desc    Add member to team
// @route   POST /api/teams/:id/members
// @access  Private (Admin/Owner only)
export const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user email'
      });
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is admin or owner
    if (!team.isAdminOrOwner(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add members'
      });
    }

    // Find user by email
    const userToAdd = await User.findOne({ email: email.toLowerCase() });

    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a member
    if (team.isMember(userToAdd._id)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this team'
      });
    }

    // Add member
    team.members.push({
      userId: userToAdd._id,
      role: role || 'member',
      joinedAt: new Date()
    });

    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members.userId', 'name email');

    res.status(200).json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding member'
    });
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private (Admin/Owner only)
export const removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is admin or owner
    if (!team.isAdminOrOwner(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove members'
      });
    }

    // Cannot remove owner
    if (team.owner.toString() === req.params.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove team owner'
      });
    }

    // Remove member
    team.members = team.members.filter(
      member => member.userId.toString() !== req.params.userId
    );

    await team.save();

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing member'
    });
  }
};

// @desc    Update member role
// @route   PUT /api/teams/:id/members/:userId
// @access  Private (Owner only)
export const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['member', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "member" or "admin"'
      });
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is owner
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team owner can update member roles'
      });
    }

    // Find and update member
    const member = team.members.find(
      m => m.userId.toString() === req.params.userId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in team'
      });
    }

    member.role = role;
    await team.save();

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating member role'
    });
  }
};

// @desc    Get team updates
// @route   GET /api/teams/:id/updates
// @access  Private
export const getTeamUpdates = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member
    if (!team.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this team'
      });
    }

    // Get updates shared with team
    const updates = await Update.find({
      teamId: team._id,
      visibility: 'team'
    })
    .populate('userId', 'name email')
    .populate('companyId', 'name')
    .populate('tags', 'name color')
    .sort({ createdAt: -1 })
    .limit(100);

    res.status(200).json({
      success: true,
      count: updates.length,
      data: updates
    });
  } catch (error) {
    console.error('Error fetching team updates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team updates'
    });
  }
};

// @desc    Get team statistics
// @route   GET /api/teams/:id/stats
// @access  Private
export const getTeamStats = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member
    if (!team.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this team'
      });
    }

    // Calculate statistics
    const totalUpdates = await Update.countDocuments({
      teamId: team._id,
      visibility: 'team'
    });

    const dailyUpdates = await Update.countDocuments({
      teamId: team._id,
      visibility: 'team',
      type: 'daily'
    });

    const weeklyUpdates = await Update.countDocuments({
      teamId: team._id,
      visibility: 'team',
      type: 'weekly'
    });

    // Get active members (members who have shared updates)
    const activeMembers = await Update.distinct('userId', {
      teamId: team._id,
      visibility: 'team'
    });

    res.status(200).json({
      success: true,
      data: {
        memberCount: team.members.length,
        totalUpdates,
        dailyUpdates,
        weeklyUpdates,
        activeMemberCount: activeMembers.length
      }
    });
  } catch (error) {
    console.error('Error fetching team stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team stats'
    });
  }
};
