import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from '@jest/globals';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';
import User from '../../../models/User.js';
import Tag from '../../../models/Tag.js';
import ScheduledUpdate from '../../../models/ScheduledUpdate.js';

describe('Model instance methods', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('User.getResetPasswordToken', () => {
    it('should return a raw token and store its hashed form with an expiry', async () => {
      const user = await User.create(createUserFixture({ email: 'reset@example.com', password: 'password123' }));

      const rawToken = user.getResetPasswordToken();

      expect(typeof rawToken).toBe('string');
      expect(rawToken).toHaveLength(64); // 32 random bytes as hex

      // The stored token must be the sha256 hash of the raw token, not the raw token
      const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      expect(user.resetPasswordToken).toBe(expectedHash);
      expect(user.resetPasswordToken).not.toBe(rawToken);

      // Expiry is set roughly one hour in the future
      expect(user.resetPasswordExpire).toBeInstanceOf(Date);
      const msUntilExpiry = user.resetPasswordExpire.getTime() - Date.now();
      expect(msUntilExpiry).toBeGreaterThan(59 * 60 * 1000);
      expect(msUntilExpiry).toBeLessThanOrEqual(60 * 60 * 1000 + 1000);
    });

    it('should produce a different token on each call', async () => {
      const user = await User.create(createUserFixture({ email: 'reset2@example.com', password: 'password123' }));
      const first = user.getResetPasswordToken();
      const second = user.getResetPasswordToken();
      expect(first).not.toBe(second);
    });
  });

  describe('User.getEmailVerificationToken', () => {
    it('should return a raw token and store its hashed form with a 24h expiry', async () => {
      const user = await User.create(createUserFixture({ email: 'verify@example.com', password: 'password123' }));

      const rawToken = user.getEmailVerificationToken();

      expect(rawToken).toHaveLength(64);
      const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      expect(user.emailVerificationToken).toBe(expectedHash);

      expect(user.emailVerificationExpire).toBeInstanceOf(Date);
      const msUntilExpiry = user.emailVerificationExpire.getTime() - Date.now();
      expect(msUntilExpiry).toBeGreaterThan(23 * 60 * 60 * 1000);
      expect(msUntilExpiry).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000);
    });
  });

  describe('User.comparePassword', () => {
    it('should return true for the correct password and false otherwise', async () => {
      const user = await User.create(createUserFixture({ email: 'cmp@example.com', password: 'secretpass1' }));
      const withPassword = await User.findById(user._id).select('+password');

      expect(await withPassword.comparePassword('secretpass1')).toBe(true);
      expect(await withPassword.comparePassword('wrongpass')).toBe(false);
    });
  });

  describe('Tag.incrementUsage', () => {
    it('should increment usageCount and persist the change', async () => {
      const tag = await Tag.create({ userId: new mongoose.Types.ObjectId(), name: 'Backend' });
      expect(tag.usageCount).toBe(0);

      await tag.incrementUsage();
      expect(tag.usageCount).toBe(1);

      const reloaded = await Tag.findById(tag._id);
      expect(reloaded.usageCount).toBe(1);
    });

    it('should accumulate across multiple calls', async () => {
      const tag = await Tag.create({ userId: new mongoose.Types.ObjectId(), name: 'Frontend', usageCount: 5 });

      await tag.incrementUsage();
      await tag.incrementUsage();

      const reloaded = await Tag.findById(tag._id);
      expect(reloaded.usageCount).toBe(7);
    });
  });

  describe('ScheduledUpdate.calculateNextRun', () => {
    const baseDoc = (overrides = {}) => ({
      userId: new mongoose.Types.ObjectId(),
      type: 'daily',
      content: 'Template content',
      scheduledTime: '09:30',
      ...overrides,
    });

    it('should schedule a one-time run using scheduledDate at the scheduled time', () => {
      const scheduledDate = new Date('2030-06-15T00:00:00Z');
      const doc = new ScheduledUpdate(baseDoc({ scheduleType: 'once', scheduledDate }));

      const nextRun = doc.calculateNextRun();

      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun.getFullYear()).toBe(2030);
      expect(nextRun.getMonth()).toBe(5); // June
      expect(nextRun.getHours()).toBe(9);
      expect(nextRun.getMinutes()).toBe(30);
    });

    it('should schedule a daily run in the future', () => {
      const doc = new ScheduledUpdate(baseDoc({ scheduleType: 'daily' }));

      const nextRun = doc.calculateNextRun();

      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun.getHours()).toBe(9);
      expect(nextRun.getMinutes()).toBe(30);
      // Never in the past
      expect(nextRun.getTime()).toBeGreaterThanOrEqual(Date.now() - 1000);
    });

    it('should schedule a weekly run on the requested day of week', () => {
      const doc = new ScheduledUpdate(baseDoc({ scheduleType: 'weekly', dayOfWeek: 3 }));

      const nextRun = doc.calculateNextRun();

      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun.getDay()).toBe(3); // Wednesday
      expect(nextRun.getTime()).toBeGreaterThan(Date.now() - 1000);
    });

    it('should schedule a monthly run on the requested day of month', () => {
      const doc = new ScheduledUpdate(baseDoc({ scheduleType: 'monthly', dayOfMonth: 15 }));

      const nextRun = doc.calculateNextRun();

      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun.getDate()).toBe(15);
      expect(nextRun.getTime()).toBeGreaterThan(Date.now() - 1000);
    });
  });
});
