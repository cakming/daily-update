import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import User from '../../../models/User.js';
import Update from '../../../models/Update.js';
import NotificationPreference from '../../../models/NotificationPreference.js';
import { generateToken } from '../../../middleware/auth.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';

const makeUpdate = (userId, overrides = {}) => ({
  userId,
  type: 'daily',
  rawInput: 'did things',
  formattedOutput: '- did things',
  ...overrides,
});

describe('Gamification API Integration Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    testUser = await User.create(
      createUserFixture({ email: 'gamify-test@example.com', password: 'password123' })
    );
    authToken = generateToken(testUser._id);
  });

  afterEach(async () => {
    await clearTestDB();
  });

  it('should require authentication', async () => {
    await request(app).get('/api/gamification').expect(401);
  });

  it('returns zeroed stats for a user with no updates', async () => {
    const res = await request(app)
      .get('/api/gamification')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.currentStreak).toBe(0);
    expect(res.body.data.totalUpdates).toBe(0);
    expect(res.body.data.earnedCount).toBe(0);
    expect(Array.isArray(res.body.data.achievements)).toBe(true);
  });

  it('computes streaks and earned achievements from the user updates', async () => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    await Update.create(makeUpdate(testUser._id, { date: today }));
    await Update.create(makeUpdate(testUser._id, { date: yesterday }));

    const res = await request(app)
      .get('/api/gamification')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.data.totalUpdates).toBe(2);
    expect(res.body.data.currentStreak).toBe(2);
    expect(res.body.data.achievements.find((a) => a.id === 'first_update').earned).toBe(true);
  });

  it('only counts the requesting user updates', async () => {
    const other = await User.create(
      createUserFixture({ email: 'other-gamify@example.com', password: 'password123' })
    );
    await Update.create(makeUpdate(other._id, { date: new Date() }));

    const res = await request(app)
      .get('/api/gamification')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.data.totalUpdates).toBe(0);
  });

  it('honors the user stored timezone preference', async () => {
    await NotificationPreference.create({ userId: testUser._id, timezone: 'America/New_York' });
    await Update.create(makeUpdate(testUser._id, { date: new Date() }));

    const res = await request(app)
      .get('/api/gamification')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Should not error and should reflect the single update.
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalUpdates).toBe(1);
  });
});
