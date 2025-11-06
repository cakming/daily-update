import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import User from '../../../models/User.js';
import Company from '../../../models/Company.js';
import Update from '../../../models/Update.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';

describe('Company API Integration Tests', () => {
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
      email: 'test@example.com',
      password: 'password123'
    });

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = registerResponse.body.data.token;
    testUser = await User.findOne({ email: 'test@example.com' });
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/companies', () => {
    it('should create a new company with valid data', async () => {
      const companyData = {
        name: 'Acme Corp',
        description: 'A test company',
        color: '#FF5733'
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(companyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Company created successfully');
      expect(response.body.data.name).toBe('Acme Corp');
      expect(response.body.data.description).toBe('A test company');
      expect(response.body.data.color).toBe('#FF5733');
      expect(response.body.data.isActive).toBe(true);
    });

    it('should create a company with default color', async () => {
      const companyData = {
        name: 'Default Color Corp'
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(companyData)
        .expect(201);

      expect(response.body.data.color).toBe('#3182CE');
    });

    it('should require authentication', async () => {
      const companyData = {
        name: 'No Auth Corp'
      };

      await request(app)
        .post('/api/companies')
        .send(companyData)
        .expect(401);
    });

    it('should reject duplicate company names', async () => {
      const companyData = {
        name: 'Duplicate Corp'
      };

      // Create first company
      await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(companyData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(companyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should reject empty company name', async () => {
      const companyData = {
        name: '   '
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(companyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /api/companies', () => {
    beforeEach(async () => {
      // Create test companies
      await Company.create({
        userId: testUser._id,
        name: 'Active Corp 1',
        isActive: true
      });

      await Company.create({
        userId: testUser._id,
        name: 'Active Corp 2',
        isActive: true
      });

      await Company.create({
        userId: testUser._id,
        name: 'Inactive Corp',
        isActive: false
      });
    });

    it('should get all active companies', async () => {
      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].name).toBeDefined();
      expect(response.body.data[0].updateCount).toBeDefined();
    });

    it('should include inactive companies when requested', async () => {
      const response = await request(app)
        .get('/api/companies?includeInactive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.count).toBe(3);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/companies')
        .expect(401);
    });

    it('should only return companies for the authenticated user', async () => {
      // Create another user and their company
      const otherUserData = createUserFixture({
        email: 'other@example.com',
        password: 'password123'
      });
      const otherUser = await User.create(otherUserData);

      await Company.create({
        userId: otherUser._id,
        name: 'Other User Corp'
      });

      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.count).toBe(2); // Only test user's companies
      expect(response.body.data.every(c => c.name !== 'Other User Corp')).toBe(true);
    });
  });

  describe('GET /api/companies/:id', () => {
    let testCompany;

    beforeEach(async () => {
      testCompany = await Company.create({
        userId: testUser._id,
        name: 'Test Corp',
        description: 'Test description'
      });

      // Create an update for this company
      await Update.create({
        userId: testUser._id,
        companyId: testCompany._id,
        type: 'daily',
        date: new Date(),
        rawInput: 'Test input',
        formattedOutput: 'Test output',
        sections: { todaysProgress: ['test'] }
      });
    });

    it('should get company by id', async () => {
      const response = await request(app)
        .get(`/api/companies/${testCompany._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Corp');
      expect(response.body.data.description).toBe('Test description');
      expect(response.body.data.updateCount).toBe(1);
    });

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .get('/api/companies/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/companies/${testCompany._id}`)
        .expect(401);
    });
  });

  describe('PUT /api/companies/:id', () => {
    let testCompany;

    beforeEach(async () => {
      testCompany = await Company.create({
        userId: testUser._id,
        name: 'Original Name',
        description: 'Original description'
      });
    });

    it('should update company successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        color: '#00FF00'
      };

      const response = await request(app)
        .put(`/api/companies/${testCompany._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated');
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.color).toBe('#00FF00');
    });

    it('should update isActive status', async () => {
      const updateData = {
        isActive: false
      };

      const response = await request(app)
        .put(`/api/companies/${testCompany._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.isActive).toBe(false);
    });

    it('should reject duplicate company name', async () => {
      // Create another company
      await Company.create({
        userId: testUser._id,
        name: 'Existing Corp'
      });

      const updateData = {
        name: 'Existing Corp'
      };

      const response = await request(app)
        .put(`/api/companies/${testCompany._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .put('/api/companies/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app)
        .put(`/api/companies/${testCompany._id}`)
        .send({ name: 'New Name' })
        .expect(401);
    });
  });

  describe('DELETE /api/companies/:id', () => {
    let testCompany;

    beforeEach(async () => {
      testCompany = await Company.create({
        userId: testUser._id,
        name: 'Delete Me Corp'
      });

      // Create updates for this company
      await Update.create({
        userId: testUser._id,
        companyId: testCompany._id,
        type: 'daily',
        date: new Date(),
        rawInput: 'Test',
        formattedOutput: 'Test',
        sections: {}
      });
    });

    it('should soft delete company by default', async () => {
      const response = await request(app)
        .delete(`/api/companies/${testCompany._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deactivated');

      // Verify company still exists but inactive
      const company = await Company.findById(testCompany._id);
      expect(company).toBeDefined();
      expect(company.isActive).toBe(false);

      // Verify updates still exist
      const updates = await Update.find({ companyId: testCompany._id });
      expect(updates.length).toBe(1);
    });

    it('should permanently delete company when requested', async () => {
      const response = await request(app)
        .delete(`/api/companies/${testCompany._id}?permanent=true`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('permanently deleted');

      // Verify company is deleted
      const company = await Company.findById(testCompany._id);
      expect(company).toBeNull();

      // Verify updates are deleted
      const updates = await Update.find({ companyId: testCompany._id });
      expect(updates.length).toBe(0);
    });

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .delete('/api/companies/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app)
        .delete(`/api/companies/${testCompany._id}`)
        .expect(401);
    });
  });

  describe('GET /api/companies/:id/stats', () => {
    let testCompany;

    beforeEach(async () => {
      testCompany = await Company.create({
        userId: testUser._id,
        name: 'Stats Corp'
      });

      // Create daily updates
      await Update.create({
        userId: testUser._id,
        companyId: testCompany._id,
        type: 'daily',
        date: new Date('2025-11-01'),
        rawInput: 'Day 1',
        formattedOutput: 'Day 1',
        sections: {}
      });

      await Update.create({
        userId: testUser._id,
        companyId: testCompany._id,
        type: 'daily',
        date: new Date('2025-11-02'),
        rawInput: 'Day 2',
        formattedOutput: 'Day 2',
        sections: {}
      });

      // Create weekly update
      await Update.create({
        userId: testUser._id,
        companyId: testCompany._id,
        type: 'weekly',
        dateRange: {
          start: new Date('2025-11-01'),
          end: new Date('2025-11-07')
        },
        rawInput: 'Week 1',
        formattedOutput: 'Week 1',
        sections: {}
      });
    });

    it('should get company statistics', async () => {
      const response = await request(app)
        .get(`/api/companies/${testCompany._id}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.company.name).toBe('Stats Corp');
      expect(response.body.data.statistics.totalUpdates).toBe(3);
      expect(response.body.data.statistics.dailyUpdates).toBe(2);
      expect(response.body.data.statistics.weeklyUpdates).toBe(1);
      expect(response.body.data.statistics.firstUpdate).toBeDefined();
      expect(response.body.data.statistics.lastUpdate).toBeDefined();
    });

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .get('/api/companies/507f1f77bcf86cd799439011/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/companies/${testCompany._id}/stats`)
        .expect(401);
    });
  });
});
