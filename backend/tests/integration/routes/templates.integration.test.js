import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import User from '../../../models/User.js';
import Template from '../../../models/Template.js';
import { generateToken } from '../../../middleware/auth.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';

describe('Template API Integration Tests', () => {
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
      createUserFixture({ email: 'templates-test@example.com', password: 'password123' })
    );
    authToken = generateToken(testUser._id);
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/templates', () => {
    it('should create a template with valid data', async () => {
      const res = await request(app)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Standup', content: 'What did I do today?', type: 'daily', category: 'work' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Standup');
      expect(res.body.data.type).toBe('daily');
      expect(res.body.data.isActive).toBe(true);
    });

    it('should default type to daily', async () => {
      const res = await request(app)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Defaults', content: 'body' })
        .expect(201);

      expect(res.body.data.type).toBe('daily');
    });

    it('should reject a template without name or content', async () => {
      const res = await request(app)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'No content' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    it('should reject a duplicate template name', async () => {
      await Template.create({ userId: testUser._id, name: 'Dup', content: 'x' });
      const res = await request(app)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Dup', content: 'y' })
        .expect(400);

      expect(res.body.message).toContain('already exists');
    });

    it('should require authentication', async () => {
      await request(app).post('/api/templates').send({ name: 'X', content: 'y' }).expect(401);
    });
  });

  describe('GET /api/templates', () => {
    beforeEach(async () => {
      await Template.create({ userId: testUser._id, name: 'Daily one', content: 'a', type: 'daily' });
      await Template.create({ userId: testUser._id, name: 'Weekly one', content: 'b', type: 'weekly' });
      await Template.create({ userId: testUser._id, name: 'Inactive', content: 'c', isActive: false });
    });

    it('should list active templates', async () => {
      const res = await request(app)
        .get('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.count).toBe(2);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/templates?type=weekly')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toBe('Weekly one');
    });

    it('should only return templates for the authenticated user', async () => {
      const other = await User.create(
        createUserFixture({ email: 'other-templates@example.com', password: 'password123' })
      );
      await Template.create({ userId: other._id, name: 'Foreign', content: 'z' });

      const res = await request(app)
        .get('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.every((t) => t.name !== 'Foreign')).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/templates').expect(401);
    });
  });

  describe('GET /api/templates/:id', () => {
    it('should get a template by id', async () => {
      const tpl = await Template.create({ userId: testUser._id, name: 'Findable', content: 'a' });
      const res = await request(app)
        .get(`/api/templates/${tpl._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.name).toBe('Findable');
    });

    it('should return 404 for a non-existent template', async () => {
      await request(app)
        .get('/api/templates/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it("should not access another user's template", async () => {
      const other = await User.create(
        createUserFixture({ email: 'owner-templates@example.com', password: 'password123' })
      );
      const tpl = await Template.create({ userId: other._id, name: 'Private', content: 'a' });
      await request(app)
        .get(`/api/templates/${tpl._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/templates/:id', () => {
    it('should update a template', async () => {
      const tpl = await Template.create({ userId: testUser._id, name: 'Orig', content: 'a' });
      const res = await request(app)
        .put(`/api/templates/${tpl._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Renamed', content: 'b' })
        .expect(200);
      expect(res.body.data.name).toBe('Renamed');
      expect(res.body.data.content).toBe('b');
    });

    it('should reject a duplicate name on update', async () => {
      const tpl = await Template.create({ userId: testUser._id, name: 'Orig', content: 'a' });
      await Template.create({ userId: testUser._id, name: 'Taken', content: 'b' });
      await request(app)
        .put(`/api/templates/${tpl._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Taken' })
        .expect(400);
    });

    it('should return 404 for a non-existent template', async () => {
      await request(app)
        .put('/api/templates/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'x' })
        .expect(404);
    });
  });

  describe('DELETE /api/templates/:id', () => {
    it('should soft delete a template', async () => {
      const tpl = await Template.create({ userId: testUser._id, name: 'Del', content: 'a' });
      const res = await request(app)
        .delete(`/api/templates/${tpl._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.message).toContain('deleted');
      const refreshed = await Template.findById(tpl._id);
      expect(refreshed.isActive).toBe(false);
    });

    it('should return 404 for a non-existent template', async () => {
      await request(app)
        .delete('/api/templates/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/templates/:id/use', () => {
    it('should increment usage count', async () => {
      const tpl = await Template.create({ userId: testUser._id, name: 'Use', content: 'a' });
      const res = await request(app)
        .post(`/api/templates/${tpl._id}/use`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.usageCount).toBe(1);
      expect(res.body.data.lastUsedAt).toBeTruthy();
    });
  });

  describe('GET /api/templates/stats', () => {
    it('should return template statistics', async () => {
      await Template.create({ userId: testUser._id, name: 'A', content: 'a', type: 'daily', usageCount: 3 });
      await Template.create({ userId: testUser._id, name: 'B', content: 'b', type: 'weekly', usageCount: 1 });

      const res = await request(app)
        .get('/api/templates/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.total).toBe(2);
      expect(res.body.data.byType.daily).toBe(1);
      expect(res.body.data.byType.weekly).toBe(1);
      expect(res.body.data.totalUsage).toBe(4);
      expect(Array.isArray(res.body.data.mostUsed)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/templates/stats').expect(401);
    });
  });
});
