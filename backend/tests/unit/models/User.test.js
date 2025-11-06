import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import User from '../../../models/User.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';

describe('User Model', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = createUserFixture({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.password).toBeDefined();
      expect(user.password).not.toBe('password123'); // Should be hashed
      expect(user.createdAt).toBeDefined();
    });

    it('should hash password before saving', async () => {
      const userData = createUserFixture({
        password: 'plainpassword'
      });

      const user = await User.create(userData);

      expect(user.password).not.toBe('plainpassword');
      expect(user.password.length).toBeGreaterThan(20); // Hashed passwords are longer
    });

    it('should convert email to lowercase', async () => {
      const userData = createUserFixture({
        email: 'TEST@EXAMPLE.COM'
      });

      const user = await User.create(userData);

      expect(user.email).toBe('test@example.com');
    });

    it('should trim whitespace from name and email', async () => {
      const userData = createUserFixture({
        name: '  Test User  ',
        email: '  test@example.com  '
      });

      const user = await User.create(userData);

      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
    });

    it('should fail without required fields', async () => {
      await expect(User.create({})).rejects.toThrow();
      await expect(User.create({ name: 'Test' })).rejects.toThrow();
      await expect(User.create({ email: 'test@example.com' })).rejects.toThrow();
    });

    it('should fail with invalid email format', async () => {
      const userData = createUserFixture({
        email: 'invalid-email'
      });

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail with duplicate email', async () => {
      const userData = createUserFixture({
        email: 'duplicate@example.com'
      });

      await User.create(userData);

      const duplicateUser = createUserFixture({
        email: 'duplicate@example.com'
      });

      await expect(User.create(duplicateUser)).rejects.toThrow();
    });

    it('should fail with password less than 6 characters', async () => {
      const userData = createUserFixture({
        password: '12345'
      });

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    describe('comparePassword', () => {
      it('should return true for correct password', async () => {
        const userData = createUserFixture({
          password: 'correctpassword'
        });

        const user = await User.create(userData);

        // Need to get user with password field (it's excluded by default)
        const userWithPassword = await User.findById(user._id).select('+password');
        const isMatch = await userWithPassword.comparePassword('correctpassword');

        expect(isMatch).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const userData = createUserFixture({
          password: 'correctpassword'
        });

        const user = await User.create(userData);

        const userWithPassword = await User.findById(user._id).select('+password');
        const isMatch = await userWithPassword.comparePassword('wrongpassword');

        expect(isMatch).toBe(false);
      });

      it('should handle empty password', async () => {
        const userData = createUserFixture({
          password: 'correctpassword'
        });

        const user = await User.create(userData);

        const userWithPassword = await User.findById(user._id).select('+password');
        const isMatch = await userWithPassword.comparePassword('');

        expect(isMatch).toBe(false);
      });
    });
  });

  describe('Password Field Selection', () => {
    it('should not include password by default', async () => {
      const userData = createUserFixture();
      const createdUser = await User.create(userData);

      const user = await User.findById(createdUser._id);

      expect(user.password).toBeUndefined();
    });

    it('should include password when explicitly selected', async () => {
      const userData = createUserFixture();
      const createdUser = await User.create(userData);

      const user = await User.findById(createdUser._id).select('+password');

      expect(user.password).toBeDefined();
    });
  });

  describe('User Updates', () => {
    it('should not rehash password if not modified', async () => {
      const userData = createUserFixture({
        password: 'originalpassword'
      });

      const user = await User.create(userData);
      const originalHash = user.password;

      user.name = 'Updated Name';
      await user.save();

      expect(user.password).toBe(originalHash);
    });

    it('should rehash password if modified', async () => {
      const userData = createUserFixture({
        password: 'originalpassword'
      });

      const user = await User.create(userData);
      const userWithPassword = await User.findById(user._id).select('+password');
      const originalHash = userWithPassword.password;

      userWithPassword.password = 'newpassword';
      await userWithPassword.save();

      expect(userWithPassword.password).not.toBe(originalHash);
      expect(userWithPassword.password).not.toBe('newpassword');
    });
  });

  describe('User Query', () => {
    it('should find user by email', async () => {
      const userData = createUserFixture({
        email: 'findme@example.com'
      });

      await User.create(userData);

      const user = await User.findOne({ email: 'findme@example.com' });

      expect(user).toBeDefined();
      expect(user.email).toBe('findme@example.com');
    });

    it('should return null for non-existent email', async () => {
      const user = await User.findOne({ email: 'nonexistent@example.com' });

      expect(user).toBeNull();
    });
  });

  describe('User Deletion', () => {
    it('should delete user successfully', async () => {
      const userData = createUserFixture();
      const user = await User.create(userData);

      await User.findByIdAndDelete(user._id);

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt timestamp', async () => {
      const userData = createUserFixture();
      const user = await User.create(userData);

      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should not change createdAt on update', async () => {
      const userData = createUserFixture();
      const user = await User.create(userData);
      const originalCreatedAt = user.createdAt;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      user.name = 'Updated Name';
      await user.save();

      expect(user.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });
});
