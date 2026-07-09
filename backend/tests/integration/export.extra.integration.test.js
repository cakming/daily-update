import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import User from '../../models/User.js';
import Company from '../../models/Company.js';
import Update from '../../models/Update.js';
import { generateToken } from '../../middleware/auth.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDb.js';
import { createUserFixture } from '../setup/fixtures.js';

// This suite seeds updates directly via Update.create (NOT through the AI-backed
// POST route) and focuses on branches not covered by export.integration.test.js:
// the PDF format, the empty-set 404s, weekly dateRange formatting, date filters,
// and the empty metadata branch.
describe('Export Controller (extra branches)', () => {
  let authToken;
  let user;
  let company;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    user = await User.create(createUserFixture({ email: 'export-extra@example.com', password: 'password123' }));
    authToken = generateToken(user._id);

    company = await Company.create({ userId: user._id, name: 'Acme Corp', color: '#123456' });

    // A daily update with a company
    await Update.create({
      userId: user._id,
      companyId: company._id,
      type: 'daily',
      date: new Date('2025-03-10'),
      rawInput: 'Daily raw input with "quotes"',
      formattedOutput: 'Daily formatted output',
      sections: { todaysProgress: ['a'], ongoingWork: [], nextSteps: [], issues: [] },
    });

    // A weekly update with a dateRange (exercises the dateRange formatting branch)
    await Update.create({
      userId: user._id,
      type: 'weekly',
      dateRange: { start: new Date('2025-03-03'), end: new Date('2025-03-09') },
      rawInput: 'Weekly raw input',
      formattedOutput: 'Weekly formatted output',
      sections: { todaysProgress: [], ongoingWork: [], nextSteps: [], issues: [] },
    });
  });

  describe('GET /api/export/pdf', () => {
    it('should export updates as a PDF file', async () => {
      const res = await request(app)
        .get('/api/export/pdf')
        .set('Authorization', `Bearer ${authToken}`)
        .buffer(true)
        .parse((response, callback) => {
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => callback(null, Buffer.concat(chunks)));
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('.pdf');
      expect(res.body.length).toBeGreaterThan(0);
      // PDF files begin with the "%PDF" magic bytes
      expect(res.body.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should return 404 when there are no updates to export', async () => {
      const other = await User.create(createUserFixture({ email: 'empty-pdf@example.com', password: 'password123' }));
      const token = generateToken(other._id);

      const res = await request(app)
        .get('/api/export/pdf')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/export/pdf');
      expect(res.status).toBe(401);
    });
  });

  describe('empty-set 404 handling', () => {
    let emptyToken;

    beforeEach(async () => {
      const other = await User.create(createUserFixture({ email: 'empty-set@example.com', password: 'password123' }));
      emptyToken = generateToken(other._id);
    });

    it('should return 404 for CSV when no updates exist', async () => {
      const res = await request(app).get('/api/export/csv').set('Authorization', `Bearer ${emptyToken}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('No updates found for export');
    });

    it('should return 404 for JSON when no updates exist', async () => {
      const res = await request(app).get('/api/export/json').set('Authorization', `Bearer ${emptyToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 404 for Markdown when no updates exist', async () => {
      const res = await request(app).get('/api/export/markdown').set('Authorization', `Bearer ${emptyToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('weekly dateRange formatting', () => {
    it('should render the weekly date range in the Markdown export', async () => {
      const res = await request(app)
        .get('/api/export/markdown')
        .query({ type: 'weekly' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.text).toContain('Weekly formatted output');
      // Range formatted like "Mar 03 - Mar 09, 2025"
      expect(res.text).toMatch(/Mar 0?3.*Mar 0?9, 2025/);
    });

    it('should render the weekly range in the CSV export', async () => {
      const res = await request(app)
        .get('/api/export/csv')
        .query({ type: 'weekly' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.text).toContain('2025-03-03');
      expect(res.text).toContain('weekly');
    });
  });

  describe('date range filtering', () => {
    it('should exclude updates outside the requested date range (daily)', async () => {
      const res = await request(app)
        .get('/api/export/csv')
        .query({ type: 'daily', startDate: '2025-01-01', endDate: '2025-01-31' })
        .set('Authorization', `Bearer ${authToken}`);

      // The only daily update is 2025-03-10, which falls outside Jan -> 404
      expect(res.status).toBe(404);
    });

    it('should include updates within the requested date range (daily)', async () => {
      const res = await request(app)
        .get('/api/export/csv')
        .query({ type: 'daily', startDate: '2025-03-01', endDate: '2025-03-31' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.text).toContain('2025-03-10');
      expect(res.text).toContain('Acme Corp');
    });
  });

  describe('GET /api/export/metadata', () => {
    it('should return count/dateRange/types for existing updates', async () => {
      const res = await request(app)
        .get('/api/export/metadata')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(2);
      expect(res.body.data.types).toEqual(expect.arrayContaining(['daily', 'weekly']));
      expect(res.body.data.dateRange).not.toBeNull();
      expect(res.body.data.estimatedSizes).toHaveProperty('csv');
    });

    it('should return an empty metadata payload when there are no updates', async () => {
      const other = await User.create(createUserFixture({ email: 'empty-meta@example.com', password: 'password123' }));
      const token = generateToken(other._id);

      const res = await request(app)
        .get('/api/export/metadata')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(0);
      expect(res.body.data.dateRange).toBeNull();
      expect(res.body.data.types).toEqual([]);
    });

    it('should filter metadata by company', async () => {
      const res = await request(app)
        .get('/api/export/metadata')
        .query({ companyId: company._id.toString() })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
    });
  });
});
