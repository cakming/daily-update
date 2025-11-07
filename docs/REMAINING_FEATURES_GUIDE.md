# Remaining Features Implementation Guide

This document provides step-by-step implementation guides for features not yet completed.

**Status**: Phase 2A and 2B are partially complete. Remaining features documented below.

---

## Table of Contents

1. [User Profile Editing](#1-user-profile-editing)
2. [Two-Factor Authentication (2FA)](#2-two-factor-authentication-2fa)
3. [Tags & Categories](#3-tags--categories)
4. [Bulk Operations](#4-bulk-operations)
5. [Email Delivery](#5-email-delivery)
6. [Update Scheduling](#6-update-scheduling)
7. [Telegram Bot](#7-telegram-bot)
8. [Google Chat Bot](#8-google-chat-bot)

---

## 1. User Profile Editing

**Effort**: 4-6 hours
**Priority**: HIGH
**Status**: Backend 50% complete

### Backend (2 hours)

**Already Completed**:
- User model has all required fields
- Password hashing pre-save hook exists

**To Implement**:

#### 1.1 Add Update Profile Endpoint

File: `backend/controllers/authController.js`

```javascript
/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide current password to change password'
        });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
        });
      }

      user.password = newPassword;
    }

    // Update name if provided
    if (name && name.trim()) {
      user.name = name.trim();
    }

    // Update email if provided and different
    if (email && email !== user.email) {
      // Check if email is already taken
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }

      user.email = email.toLowerCase();
      user.emailVerified = false; // Require re-verification
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
```

#### 1.2 Add Route

File: `backend/routes/auth.js`

```javascript
// Add to imports
import { updateProfile } from '../controllers/authController.js';

// Add route
router.put('/profile', protect, updateProfile);
```

### Frontend (2-4 hours)

#### 1.3 Create Profile/Settings Page

File: `frontend/src/pages/Profile.jsx`

```javascript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Card,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Badge,
} from '@chakra-ui/react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await authAPI.updateProfile(updateData);

      // Update local user data
      setUser(response.data.data);
      localStorage.setItem('user', JSON.stringify(response.data.data));

      toast({
        title: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
      });

      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" borderBottomWidth="1px" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <Heading size="lg" color="purple.600">
              Profile Settings
            </Heading>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </HStack>
        </Container>
      </Box>

      <Container maxW="2xl" py={8}>
        <Card.Root p={8}>
          <form onSubmit={handleSubmit}>
            <VStack gap={6} align="stretch">
              <Heading size="md">Account Information</Heading>

              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>
                  Email
                  {user?.emailVerified && (
                    <Badge ml={2} colorScheme="green">
                      Verified
                    </Badge>
                  )}
                </FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </FormControl>

              <Heading size="md" mt={4}>
                Change Password (Optional)
              </Heading>

              <FormControl>
                <FormLabel>Current Password</FormLabel>
                <Input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, currentPassword: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>New Password</FormLabel>
                <Input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="At least 6 characters"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Confirm New Password</FormLabel>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="purple"
                isLoading={loading}
                loadingText="Updating..."
                w="full"
                mt={4}
              >
                Update Profile
              </Button>
            </VStack>
          </form>
        </Card.Root>
      </Container>
    </Box>
  );
};

export default Profile;
```

#### 1.4 Update API Service

File: `frontend/src/services/api.js`

```javascript
// Add to authAPI object
updateProfile: (data) => api.put('/auth/profile', data),
```

#### 1.5 Add Route

File: `frontend/src/App.jsx`

```javascript
// Import
import Profile from './pages/Profile';

// Add route
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>
```

#### 1.6 Add Dashboard Link

File: `frontend/src/pages/Dashboard.jsx`

Add a "Profile Settings" card to the dashboard.

---

## 2. Two-Factor Authentication (2FA)

**Effort**: 2-3 days
**Priority**: MEDIUM-HIGH
**Status**: Not started

### Dependencies

```bash
cd backend
npm install speakeasy qrcode
```

### Backend (1.5 days)

#### 2.1 Update User Model

File: `backend/models/User.js`

```javascript
// Add fields to schema
twoFactorEnabled: {
  type: Boolean,
  default: false
},
twoFactorSecret: {
  type: String,
  select: false
},
twoFactorBackupCodes: {
  type: [String],
  select: false
}
```

#### 2.2 Create 2FA Controller

File: `backend/controllers/twoFactorController.js`

```javascript
import User from '../models/User.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * @desc    Generate 2FA secret and QR code
 * @route   POST /api/auth/2fa/setup
 * @access  Private
 */
export const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled'
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Daily Update App (${user.email})`,
      length: 32
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Save secret (not enabled yet)
    user.twoFactorSecret = secret.base32;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode
      }
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Verify and enable 2FA
 * @route   POST /api/auth/2fa/verify
 * @access  Private
 */
export const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a verification token'
      });
    }

    const user = await User.findById(req.user._id).select('+twoFactorSecret +twoFactorBackupCodes');

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Please set up 2FA first'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = backupCodes;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: '2FA enabled successfully',
      data: {
        backupCodes
      }
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Disable 2FA
 * @route   POST /api/auth/2fa/disable
 * @access  Private
 */
export const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password'
      });
    }

    const user = await User.findById(req.user._id).select('+password +twoFactorSecret +twoFactorBackupCodes');

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
```

#### 2.3 Update Login Controller

File: `backend/controllers/authController.js`

```javascript
// Modify login function to check for 2FA
export const login = async (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body;

    const user = await User.findOne({ email }).select('+password +twoFactorEnabled +twoFactorSecret');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return res.status(200).json({
          success: true,
          require2FA: true,
          message: 'Please provide 2FA token'
        });
      }

      // Verify 2FA token
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorToken,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({
          success: false,
          message: 'Invalid 2FA token'
        });
      }
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};
```

#### 2.4 Add Routes

File: `backend/routes/auth.js`

```javascript
import { setup2FA, verify2FA, disable2FA } from '../controllers/twoFactorController.js';

router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);
```

### Frontend (1-1.5 days)

#### 2.5 Create 2FA Setup Page

File: `frontend/src/pages/TwoFactorSetup.jsx`

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  VStack,
  Button,
  Card,
  Text,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Image,
  Alert,
  AlertIcon,
  List,
  ListItem,
} from '@chakra-ui/react';
import { authAPI } from '../services/api';

const TwoFactorSetup = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1); // 1: setup, 2: verify, 3: backup codes
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const response = await authAPI.setup2FA();
      setQrCode(response.data.data.qrCode);
      setSecret(response.data.data.secret);
      setStep(2);
    } catch (error) {
      toast({
        title: 'Setup failed',
        description: error.response?.data?.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const response = await authAPI.verify2FA({ token });
      setBackupCodes(response.data.data.backupCodes);
      setStep(3);
      toast({
        title: '2FA enabled successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: error.response?.data?.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Container maxW="2xl">
        <Card.Root p={8}>
          <VStack gap={6} align="stretch">
            <Heading size="lg">Two-Factor Authentication Setup</Heading>

            {step === 1 && (
              <>
                <Text>
                  Add an extra layer of security to your account by enabling two-factor
                  authentication (2FA).
                </Text>
                <Button
                  onClick={handleSetup}
                  colorScheme="blue"
                  isLoading={loading}
                  loadingText="Setting up..."
                >
                  Start Setup
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <Text fontWeight="bold">Step 1: Scan QR Code</Text>
                <Text fontSize="sm">
                  Use an authenticator app (Google Authenticator, Authy, etc.) to scan this QR
                  code:
                </Text>
                <Image src={qrCode} alt="QR Code" maxW="300px" mx="auto" />
                <Text fontSize="sm" textAlign="center" color="gray.600">
                  Or enter this code manually: <br />
                  <code>{secret}</code>
                </Text>

                <Text fontWeight="bold" mt={4}>
                  Step 2: Verify
                </Text>
                <FormControl isRequired>
                  <FormLabel>Enter 6-digit code from your app</FormLabel>
                  <Input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                  />
                </FormControl>

                <Button
                  onClick={handleVerify}
                  colorScheme="green"
                  isLoading={loading}
                  loadingText="Verifying..."
                >
                  Verify and Enable
                </Button>
              </>
            )}

            {step === 3 && (
              <>
                <Alert status="success">
                  <AlertIcon />
                  2FA has been enabled successfully!
                </Alert>

                <Text fontWeight="bold">Backup Codes</Text>
                <Text fontSize="sm">
                  Save these backup codes in a safe place. You can use them to access your account
                  if you lose your authenticator device.
                </Text>

                <Card.Root p={4} bg="gray.50">
                  <List.Root>
                    {backupCodes.map((code, index) => (
                      <ListItem key={index} fontFamily="monospace">
                        {code}
                      </ListItem>
                    ))}
                  </List.Root>
                </Card.Root>

                <Button onClick={() => navigate('/profile')} colorScheme="blue" w="full">
                  Return to Profile
                </Button>
              </>
            )}
          </VStack>
        </Card.Root>
      </Container>
    </Box>
  );
};

export default TwoFactorSetup;
```

#### 2.6 Update Login Page for 2FA

Modify login to handle 2FA token input when `require2FA` is true.

---

## 3. Tags & Categories

**Effort**: 2-3 days
**Priority**: HIGH
**Status**: Not started

### Backend (1 day)

#### 3.1 Create Tag Model

File: `backend/models/Tag.js`

```javascript
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

const Tag = mongoose.model('Tag', tagSchema);

export default Tag;
```

#### 3.2 Update Update Model

File: `backend/models/Update.js`

```javascript
// Add to schema
tags: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tag'
}]
```

#### 3.3 Create Tag Controller

File: `backend/controllers/tagController.js`

```javascript
import Tag from '../models/Tag.js';
import Update from '../models/Update.js';

// CRUD operations for tags
// - createTag
// - getTags
// - getTagById
// - updateTag
// - deleteTag (soft delete)
// - getTagStats (usage statistics)
```

#### 3.4 Add Routes

File: `backend/routes/tags.js`

```javascript
import express from 'express';
import { protect } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import {
  createTag,
  getTags,
  getTagById,
  updateTag,
  deleteTag,
  getTagStats
} from '../controllers/tagController.js';

const router = express.Router();

router.use(protect);
router.use(apiLimiter);

router.get('/stats', getTagStats);
router.post('/', createTag);
router.get('/', getTags);
router.get('/:id', getTagById);
router.put('/:id', updateTag);
router.delete('/:id', deleteTag);

export default router;
```

### Frontend (1-2 days)

#### 3.5 Create Tag Components

- `TagManager.jsx` - CRUD interface for tags
- `TagSelector.jsx` - Multi-select for updates
- `TagFilter.jsx` - Filter updates by tags

#### 3.6 Integration Points

- CreateDailyUpdate: Add tag selector
- CreateWeeklyUpdate: Add tag selector
- History: Add tag filters
- Analytics: Show tag-based statistics

---

## 4. Bulk Operations

**Effort**: 1-2 days
**Priority**: MEDIUM
**Status**: Not started

### Backend (4 hours)

#### 4.1 Create Bulk Operations Controller

File: `backend/controllers/bulkController.js`

```javascript
import Update from '../models/Update.js';

/**
 * @desc    Bulk delete updates
 * @route   POST /api/bulk/delete
 * @access  Private
 */
export const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of update IDs'
      });
    }

    // Verify all updates belong to the user
    const updates = await Update.find({
      _id: { $in: ids },
      userId: req.user._id
    });

    if (updates.length !== ids.length) {
      return res.status(403).json({
        success: false,
        message: 'Some updates do not belong to you'
      });
    }

    await Update.deleteMany({
      _id: { $in: ids },
      userId: req.user._id
    });

    res.json({
      success: true,
      message: `${ids.length} updates deleted successfully`
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk assign tags
 * @route   POST /api/bulk/assign-tags
 * @access  Private
 */
export const bulkAssignTags = async (req, res) => {
  try {
    const { updateIds, tagIds } = req.body;

    if (!updateIds || !tagIds) {
      return res.status(400).json({
        success: false,
        message: 'Please provide update IDs and tag IDs'
      });
    }

    await Update.updateMany(
      {
        _id: { $in: updateIds },
        userId: req.user._id
      },
      {
        $addToSet: { tags: { $each: tagIds } }
      }
    );

    res.json({
      success: true,
      message: 'Tags assigned successfully'
    });
  } catch (error) {
    console.error('Bulk assign tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk assign company
 * @route   POST /api/bulk/assign-company
 * @access  Private
 */
export const bulkAssignCompany = async (req, res) => {
  try {
    const { updateIds, companyId } = req.body;

    if (!updateIds) {
      return res.status(400).json({
        success: false,
        message: 'Please provide update IDs'
      });
    }

    await Update.updateMany(
      {
        _id: { $in: updateIds },
        userId: req.user._id
      },
      {
        companyId: companyId || null
      }
    );

    res.json({
      success: true,
      message: 'Company assigned successfully'
    });
  } catch (error) {
    console.error('Bulk assign company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
```

#### 4.2 Add Routes

File: `backend/routes/bulk.js`

```javascript
import express from 'express';
import { protect } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import {
  bulkDelete,
  bulkAssignTags,
  bulkAssignCompany
} from '../controllers/bulkController.js';

const router = express.Router();

router.use(protect);
router.use(apiLimiter);

router.post('/delete', bulkDelete);
router.post('/assign-tags', bulkAssignTags);
router.post('/assign-company', bulkAssignCompany);

export default router;
```

Register in `backend/app.js`:

```javascript
import bulkRoutes from './routes/bulk.js';
app.use('/api/bulk', bulkRoutes);
```

### Frontend (4-8 hours)

#### 4.3 Update History Page

Add checkbox selection UI:

```javascript
// State
const [selectedUpdates, setSelectedUpdates] = useState([]);
const [bulkMode, setBulkMode] = useState(false);

// Toggle all
const handleToggleAll = () => {
  if (selectedUpdates.length === filteredUpdates.length) {
    setSelectedUpdates([]);
  } else {
    setSelectedUpdates(filteredUpdates.map(u => u._id));
  }
};

// Bulk actions
const handleBulkDelete = async () => {
  if (!window.confirm(`Delete ${selectedUpdates.length} updates?`)) return;

  try {
    await bulkAPI.bulkDelete({ ids: selectedUpdates });
    toast({ title: 'Updates deleted', status: 'success' });
    setSelectedUpdates([]);
    fetchUpdates();
  } catch (error) {
    toast({ title: 'Bulk delete failed', status: 'error' });
  }
};

// Add UI components:
// - "Select" button to enter bulk mode
// - Checkboxes on each update card
// - Bulk action toolbar when items selected
```

---

## 5. Email Delivery

**Effort**: 3-4 days
**Priority**: MEDIUM
**Status**: Email service exists, needs delivery feature

### Setup (15 minutes)

```bash
cd backend
npm install nodemailer
```

### Backend (1.5 days)

#### 5.1 Configure Email Service for Production

File: `backend/services/emailService.js`

Currently has console logging. Add production email sending:

```javascript
import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // SendGrid SMTP
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else {
    // Development: use console
    return null;
  }
};

export const sendUpdateByEmail = async ({ to, subject, content, from }) => {
  const transporter = createTransporter();

  if (!transporter) {
    // Development mode
    console.log('\n📧 EMAIL:', { to, subject, content });
    return { success: true };
  }

  const mailOptions = {
    from: from || process.env.FROM_EMAIL || 'noreply@dailyupdate.app',
    to,
    subject,
    text: content,
    html: content.replace(/\n/g, '<br>')
  };

  await transporter.sendMail(mailOptions);
  return { success: true };
};
```

#### 5.2 Create Email Delivery Controller

File: `backend/controllers/emailDeliveryController.js`

```javascript
import Update from '../models/Update.js';
import { sendUpdateByEmail } from '../services/emailService.js';

/**
 * @desc    Send update by email
 * @route   POST /api/email/send-update/:id
 * @access  Private
 */
export const sendUpdateByEmailController = async (req, res) => {
  try {
    const { to, subject } = req.body;
    const updateId = req.params.id;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Please provide recipient email and subject'
      });
    }

    const update = await Update.findOne({
      _id: updateId,
      userId: req.user._id
    });

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Update not found'
      });
    }

    await sendUpdateByEmail({
      to,
      subject,
      content: update.formattedOutput,
      from: req.user.email
    });

    res.json({
      success: true,
      message: 'Update sent successfully'
    });
  } catch (error) {
    console.error('Send update email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
```

### Frontend (1.5-2 days)

#### 5.3 Create Email Modal Component

File: `frontend/src/components/EmailModal.jsx`

```javascript
import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { emailAPI } from '../services/api';

const EmailModal = ({ isOpen, onClose, update }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to: '',
    subject: `Update: ${new Date(update.date).toLocaleDateString()}`
  });

  const handleSend = async () => {
    setLoading(true);
    try {
      await emailAPI.sendUpdate(update._id, formData);
      toast({
        title: 'Email sent successfully',
        status: 'success',
        duration: 3000,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to send email',
        description: error.response?.data?.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Send Update by Email</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack gap={4}>
            <FormControl isRequired>
              <FormLabel>To (Email)</FormLabel>
              <Input
                type="email"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                placeholder="client@example.com"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Subject</FormLabel>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSend}
            isLoading={loading}
            loadingText="Sending..."
          >
            Send Email
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EmailModal;
```

---

## 6. Update Scheduling

**Effort**: 2-3 days
**Priority**: LOW-MEDIUM
**Status**: Not started

### Dependencies

```bash
cd backend
npm install node-cron
```

### Implementation Overview

Create a cron job system for:
- Scheduled update reminders
- Auto-generate weekly summaries
- Email delivery scheduling

File: `backend/services/scheduler.js`

```javascript
import cron from 'node-cron';
import { sendUpdateByEmail } from './emailService.js';
import User from '../models/User.js';

// Daily reminder at 9 AM
export const scheduleReminders = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Sending daily update reminders...');
    // Logic to send reminders
  });
};

// Auto-generate weekly summaries on Fridays at 5 PM
export const scheduleWeeklySummaries = () => {
  cron.schedule('0 17 * * 5', async () => {
    console.log('Generating weekly summaries...');
    // Logic to auto-generate summaries
  });
};
```

Initialize in `backend/server.js`:

```javascript
import { scheduleReminders, scheduleWeeklySummaries } from './services/scheduler.js';

if (process.env.NODE_ENV === 'production') {
  scheduleReminders();
  scheduleWeeklySummaries();
}
```

---

## 7. Telegram Bot

**Effort**: 5-7 days
**Priority**: LOW (Future Enhancement)
**Status**: Not started

### Overview

Create a Telegram bot for:
- Morning update reminders
- Quick update submission
- View recent updates
- Send updates to channels

### Dependencies

```bash
npm install node-telegram-bot-api
```

### Architecture

```
bot/
├── index.js          # Bot initialization
├── handlers/
│   ├── start.js      # /start command
│   ├── send.js       # /send command
│   ├── edit.js       # /edit command
│   └── view.js       # /view command
├── middleware/
│   └── auth.js       # User authentication
└── utils/
    └── format.js     # Message formatting
```

### Implementation Steps

1. Create bot with BotFather on Telegram
2. Store bot token in environment
3. Create webhook endpoint
4. Implement command handlers
5. Add inline keyboards for quick actions
6. Deploy bot service (separate from main app)

### Example Bot Code

File: `bot/index.js`

```javascript
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const API_URL = process.env.API_URL;

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(chatId,
    'Welcome to Daily Update Bot!\n\n' +
    'Commands:\n' +
    '/send - Create new update\n' +
    '/view - View recent updates\n' +
    '/help - Show help'
  );
});

// /send command
bot.onText(/\/send/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(chatId,
    'Please enter your update content:',
    {
      reply_markup: {
        force_reply: true
      }
    }
  );
});

// Handle replies
bot.on('message', async (msg) => {
  if (msg.reply_to_message) {
    // Process update submission
    const content = msg.text;
    const chatId = msg.chat.id;

    try {
      // Call API to create update
      await axios.post(`${API_URL}/daily-updates`, {
        rawInput: content
      });

      await bot.sendMessage(chatId, 'Update created successfully!');
    } catch (error) {
      await bot.sendMessage(chatId, 'Error creating update');
    }
  }
});
```

### Deployment

Deploy as separate service on:
- Heroku
- Railway
- DigitalOcean App Platform

---

## 8. Google Chat Bot

**Effort**: 5-7 days
**Priority**: LOW (Future Enhancement)
**Status**: Not started

### Overview

Google Chat bot for:
- Space integration
- Auto-collect team updates
- Post formatted summaries
- Command-based interactions

### Setup

1. Enable Google Chat API
2. Create service account
3. Configure OAuth 2.0
4. Deploy Cloud Function or App Script

### Architecture

```
google-chat-bot/
├── index.js          # Main handler
├── auth/
│   └── google.js     # OAuth setup
├── handlers/
│   ├── message.js    # Message handler
│   ├── command.js    # Command parser
│   └── card.js       # Card builder
└── deploy.sh         # Deployment script
```

### Example Handler

File: `google-chat-bot/index.js`

```javascript
exports.chatbot = async (req, res) => {
  const event = req.body;

  if (event.type === 'MESSAGE') {
    const message = event.message.text;

    if (message.includes('@bot send-update')) {
      // Create update from message
      const update = await createUpdate(message);

      return res.json({
        text: `Update created: ${update.id}`
      });
    }
  }

  if (event.type === 'ADDED_TO_SPACE') {
    return res.json({
      text: 'Thanks for adding me! Use @bot help to see commands.'
    });
  }

  return res.json({});
};

async function createUpdate(content) {
  // API call to create update
  return await fetch(API_URL + '/daily-updates', {
    method: 'POST',
    body: JSON.stringify({ rawInput: content })
  });
}
```

### Deployment

Deploy as:
- Google Cloud Function
- Google App Engine
- Cloud Run container

---

## Priority Summary

### Immediate (This Sprint)
1. ✅ Company Management UI (completed)
2. ✅ Analytics Dashboard (completed)
3. ✅ History Page Enhancements (completed)
4. ✅ Password Reset (completed)
5. ✅ Email Verification (completed)
6. ⏳ User Profile Editing (4-6h)

### Short Term (Next Sprint)
7. Tags & Categories (2-3 days)
8. Bulk Operations (1-2 days)
9. Two-Factor Authentication (2-3 days)

### Medium Term (Month 2)
10. Email Delivery (3-4 days)
11. Update Scheduling (2-3 days)

### Long Term (Month 3+)
12. Telegram Bot (5-7 days)
13. Google Chat Bot (5-7 days)

---

## Environment Variables Reference

Add to `.env` for new features:

```env
# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Google Chat Bot
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_PROJECT_ID=your_project_id
```

---

## Testing Checklist

For each feature, ensure:

- [ ] Unit tests for models
- [ ] Integration tests for controllers
- [ ] Frontend component tests
- [ ] E2E tests for critical flows
- [ ] Security testing (authentication, authorization)
- [ ] Performance testing (for bulk operations)
- [ ] Error handling and edge cases
- [ ] Documentation updated

---

## Support

For questions or issues:
1. Check existing documentation
2. Review feature backlog
3. Create issue in repository
4. Consult implementation examples above

---

**Last Updated**: 2025-11-06
**Document Version**: 1.0
**Maintained By**: Development Team
