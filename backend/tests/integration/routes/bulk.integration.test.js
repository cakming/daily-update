import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import User from '../../../models/User.js';
import Update from '../../../models/Update.js';
import Tag from '../../../models/Tag.js';
import Company from '../../../models/Company.js';
import { generateToken } from '../../../middleware/auth.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture, createDailyUpdateFixture } from '../../setup/fixtures.js';

describe('Bulk API Integration Tests', () => {
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
      createUserFixture({ email: 'bulk-test@example.com', password: 'password123' })
    );
    authToken = generateToken(testUser._id);
  });

  afterEach(async () => {
    await clearTestDB();
  });

  const makeUpdate = () => Update.create(createDailyUpdateFixture(testUser._id));

  describe('POST /api/bulk/delete', () => {
    it('should bulk delete updates owned by the user', async () => {
      const u1 = await makeUpdate();
      const u2 = await makeUpdate();

      const res = await request(app)
        .post('/api/bulk/delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: [u1._id, u2._id] })
        .expect(200);

      expect(res.body.deletedCount).toBe(2);
      expect(await Update.countDocuments({ userId: testUser._id })).toBe(0);
    });

    it('should reject an empty ids array', async () => {
      await request(app)
        .post('/api/bulk/delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: [] })
        .expect(400);
    });

    it("should reject deleting another user's updates", async () => {
      const other = await User.create(
        createUserFixture({ email: 'other-bulk@example.com', password: 'password123' })
      );
      const foreign = await Update.create(createDailyUpdateFixture(other._id));
      await request(app)
        .post('/api/bulk/delete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: [foreign._id] })
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app).post('/api/bulk/delete').send({ ids: [] }).expect(401);
    });
  });

  describe('POST /api/bulk/assign-tags', () => {
    it('should assign tags to updates', async () => {
      const u = await makeUpdate();
      const tag = await Tag.create({ userId: testUser._id, name: 'BulkTag' });

      const res = await request(app)
        .post('/api/bulk/assign-tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ updateIds: [u._id], tagIds: [tag._id] })
        .expect(200);

      expect(res.body.updatedCount).toBe(1);
      const refreshed = await Update.findById(u._id);
      expect(refreshed.tags.map((t) => t.toString())).toContain(tag._id.toString());
    });

    it('should reject when tagIds is missing', async () => {
      const u = await makeUpdate();
      await request(app)
        .post('/api/bulk/assign-tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ updateIds: [u._id] })
        .expect(400);
    });

    it("should reject foreign tags", async () => {
      const u = await makeUpdate();
      const other = await User.create(
        createUserFixture({ email: 'other-bulk-tag@example.com', password: 'password123' })
      );
      const foreignTag = await Tag.create({ userId: other._id, name: 'Foreign' });
      await request(app)
        .post('/api/bulk/assign-tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ updateIds: [u._id], tagIds: [foreignTag._id] })
        .expect(403);
    });
  });

  describe('POST /api/bulk/remove-tags', () => {
    it('should remove tags from updates', async () => {
      const tag = await Tag.create({ userId: testUser._id, name: 'ToRemove' });
      const u = await Update.create(createDailyUpdateFixture(testUser._id, { tags: [tag._id] }));

      const res = await request(app)
        .post('/api/bulk/remove-tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ updateIds: [u._id], tagIds: [tag._id] })
        .expect(200);

      expect(res.body.updatedCount).toBe(1);
      const refreshed = await Update.findById(u._id);
      expect(refreshed.tags.length).toBe(0);
    });
  });

  describe('POST /api/bulk/assign-company', () => {
    it('should assign a company to updates', async () => {
      const u = await makeUpdate();
      const company = await Company.create({ userId: testUser._id, name: 'Acme' });

      const res = await request(app)
        .post('/api/bulk/assign-company')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ updateIds: [u._id], companyId: company._id })
        .expect(200);

      expect(res.body.updatedCount).toBe(1);
      const refreshed = await Update.findById(u._id);
      expect(refreshed.companyId.toString()).toBe(company._id.toString());
    });

    it('should remove the company when companyId is null', async () => {
      const company = await Company.create({ userId: testUser._id, name: 'Acme' });
      const u = await Update.create(createDailyUpdateFixture(testUser._id, { companyId: company._id }));

      await request(app)
        .post('/api/bulk/assign-company')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ updateIds: [u._id], companyId: null })
        .expect(200);

      const refreshed = await Update.findById(u._id);
      expect(refreshed.companyId).toBeFalsy();
    });
  });

  describe('POST /api/bulk/export', () => {
    it('should export updates as JSON by default', async () => {
      const u = await makeUpdate();
      const res = await request(app)
        .post('/api/bulk/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: [u._id] })
        .expect(200);
      expect(res.body.count).toBe(1);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should export updates as CSV', async () => {
      const u = await makeUpdate();
      const res = await request(app)
        .post('/api/bulk/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: [u._id], format: 'csv' })
        .expect(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Type,Date,Company,Content');
    });

    it('should return 404 when no updates match', async () => {
      await request(app)
        .post('/api/bulk/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: ['507f1f77bcf86cd799439011'] })
        .expect(404);
    });
  });
});
