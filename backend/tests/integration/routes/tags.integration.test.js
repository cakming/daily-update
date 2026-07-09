import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import User from '../../../models/User.js';
import Tag from '../../../models/Tag.js';
import Update from '../../../models/Update.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';

describe('Tag API Integration Tests', () => {
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

    // Create and login a test user
    const userData = createUserFixture({
      email: 'tags-test@example.com',
      password: 'password123'
    });

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = registerResponse.body.data.token;
    testUser = await User.findOne({ email: 'tags-test@example.com' });
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/tags', () => {
    it('should create a new tag with valid data', async () => {
      const tagData = {
        name: 'Backend',
        color: '#FF5733',
        category: 'project'
      };

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tagData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Tag created successfully');
      expect(response.body.data.name).toBe('Backend');
      expect(response.body.data.color).toBe('#FF5733');
      expect(response.body.data.category).toBe('project');
      expect(response.body.data.isActive).toBe(true);
    });

    it('should create a tag with default color and category', async () => {
      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Defaults' })
        .expect(201);

      expect(response.body.data.color).toBe('#3182CE');
      expect(response.body.data.category).toBe('custom');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/tags')
        .send({ name: 'No Auth Tag' })
        .expect(401);
    });

    it('should reject a tag without a name', async () => {
      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ color: '#000000' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should reject duplicate tag names', async () => {
      await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Duplicate' })
        .expect(201);

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Duplicate' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/tags', () => {
    beforeEach(async () => {
      await Tag.create({ userId: testUser._id, name: 'Active 1', isActive: true, category: 'project' });
      await Tag.create({ userId: testUser._id, name: 'Active 2', isActive: true, category: 'status' });
      await Tag.create({ userId: testUser._id, name: 'Inactive', isActive: false });
    });

    it('should get all active tags', async () => {
      const response = await request(app)
        .get('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data.length).toBe(2);
    });

    it('should include inactive tags when requested', async () => {
      const response = await request(app)
        .get('/api/tags?includeInactive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.count).toBe(3);
    });

    it('should filter tags by category', async () => {
      const response = await request(app)
        .get('/api/tags?category=project')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.count).toBe(1);
      expect(response.body.data[0].name).toBe('Active 1');
    });

    it('should require authentication', async () => {
      await request(app).get('/api/tags').expect(401);
    });

    it('should only return tags for the authenticated user', async () => {
      const otherUser = await User.create(
        createUserFixture({ email: 'other-tags@example.com', password: 'password123' })
      );
      await Tag.create({ userId: otherUser._id, name: 'Other User Tag' });

      const response = await request(app)
        .get('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.count).toBe(2);
      expect(response.body.data.every(t => t.name !== 'Other User Tag')).toBe(true);
    });
  });

  describe('GET /api/tags/:id', () => {
    let testTag;

    beforeEach(async () => {
      testTag = await Tag.create({ userId: testUser._id, name: 'Findable' });
    });

    it('should get a tag by id', async () => {
      const response = await request(app)
        .get(`/api/tags/${testTag._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Findable');
    });

    it('should return 404 for a non-existent tag', async () => {
      const response = await request(app)
        .get('/api/tags/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should not allow access to another user\'s tag', async () => {
      const otherUser = await User.create(
        createUserFixture({ email: 'owner-tags@example.com', password: 'password123' })
      );
      const otherTag = await Tag.create({ userId: otherUser._id, name: 'Private Tag' });

      const response = await request(app)
        .get(`/api/tags/${otherTag._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app).get(`/api/tags/${testTag._id}`).expect(401);
    });
  });

  describe('PUT /api/tags/:id', () => {
    let testTag;

    beforeEach(async () => {
      testTag = await Tag.create({ userId: testUser._id, name: 'Original', category: 'custom' });
    });

    it('should update a tag successfully', async () => {
      const response = await request(app)
        .put(`/api/tags/${testTag._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Renamed', color: '#00FF00', category: 'priority' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated');
      expect(response.body.data.name).toBe('Renamed');
      expect(response.body.data.color).toBe('#00FF00');
      expect(response.body.data.category).toBe('priority');
    });

    it('should update isActive status', async () => {
      const response = await request(app)
        .put(`/api/tags/${testTag._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.data.isActive).toBe(false);
    });

    it('should reject a duplicate tag name on update', async () => {
      await Tag.create({ userId: testUser._id, name: 'Taken' });

      const response = await request(app)
        .put(`/api/tags/${testTag._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Taken' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should return 404 for a non-existent tag', async () => {
      const response = await request(app)
        .put('/api/tags/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Whatever' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app)
        .put(`/api/tags/${testTag._id}`)
        .send({ name: 'Whatever' })
        .expect(401);
    });
  });

  describe('DELETE /api/tags/:id', () => {
    let testTag;

    beforeEach(async () => {
      testTag = await Tag.create({ userId: testUser._id, name: 'Delete Me' });
    });

    it('should soft delete a tag by default', async () => {
      const response = await request(app)
        .delete(`/api/tags/${testTag._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deactivated');

      const tag = await Tag.findById(testTag._id);
      expect(tag).not.toBeNull();
      expect(tag.isActive).toBe(false);
    });

    it('should permanently delete a tag when requested and remove it from updates', async () => {
      const update = await Update.create({
        userId: testUser._id,
        type: 'daily',
        date: new Date(),
        rawInput: 'Test',
        formattedOutput: 'Test',
        sections: {},
        tags: [testTag._id]
      });

      const response = await request(app)
        .delete(`/api/tags/${testTag._id}?permanent=true`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('permanently deleted');

      const tag = await Tag.findById(testTag._id);
      expect(tag).toBeNull();

      const refreshed = await Update.findById(update._id);
      expect(refreshed.tags.map(t => t.toString())).not.toContain(testTag._id.toString());
    });

    it('should return 404 for a non-existent tag', async () => {
      const response = await request(app)
        .delete('/api/tags/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app).delete(`/api/tags/${testTag._id}`).expect(401);
    });
  });

  describe('GET /api/tags/stats', () => {
    beforeEach(async () => {
      const projectTag = await Tag.create({
        userId: testUser._id,
        name: 'Proj',
        category: 'project',
        usageCount: 3
      });
      await Tag.create({ userId: testUser._id, name: 'Prio', category: 'priority', usageCount: 1 });

      await Update.create({
        userId: testUser._id,
        type: 'daily',
        date: new Date(),
        rawInput: 'Test',
        formattedOutput: 'Test',
        sections: {},
        tags: [projectTag._id]
      });
    });

    it('should return tag statistics', async () => {
      const response = await request(app)
        .get('/api/tags/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalTags).toBe(2);
      expect(response.body.data.tagsByCategory.project).toBe(1);
      expect(response.body.data.tagsByCategory.priority).toBe(1);
      expect(Array.isArray(response.body.data.mostUsed)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/tags/stats').expect(401);
    });
  });
});
