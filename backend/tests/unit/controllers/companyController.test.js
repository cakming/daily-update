import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture } from '../../setup/fixtures.js';
import User from '../../../models/User.js';
import Company from '../../../models/Company.js';
import Update from '../../../models/Update.js';
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getCompanyStats
} from '../../../controllers/companyController.js';

describe('Company Controller', () => {
  let mockReq;
  let mockRes;
  let testUser;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create test user
    const userData = createUserFixture({
      email: 'test@example.com',
      password: 'password123'
    });
    testUser = await User.create(userData);

    // Setup mock request and response objects
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: testUser
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };
  });

  afterEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();
  });

  describe('createCompany', () => {
    it('should create a company successfully', async () => {
      mockReq.body = {
        name: 'Acme Corp',
        description: 'A test company',
        color: '#FF5733'
      };

      await createCompany(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Company created successfully',
          data: expect.objectContaining({
            name: 'Acme Corp',
            description: 'A test company',
            color: '#FF5733'
          })
        })
      );
    });

    it('should create a company with default color', async () => {
      mockReq.body = {
        name: 'Default Color Corp'
      };

      await createCompany(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            color: '#3182CE'
          })
        })
      );
    });

    it('should fail without company name', async () => {
      mockReq.body = {
        description: 'No name provided'
      };

      await createCompany(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Company name is required'
        })
      );
    });

    it('should fail with empty name', async () => {
      mockReq.body = {
        name: '   '
      };

      await createCompany(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Company name is required'
        })
      );
    });

    it('should fail with duplicate company name', async () => {
      // Create first company
      await Company.create({
        userId: testUser._id,
        name: 'Duplicate Corp'
      });

      // Try to create another with same name
      mockReq.body = {
        name: 'Duplicate Corp'
      };

      await createCompany(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'A company with this name already exists'
        })
      );
    });

    it('should trim whitespace from name', async () => {
      mockReq.body = {
        name: '  Trimmed Corp  '
      };

      await createCompany(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Trimmed Corp'
          })
        })
      );
    });
  });

  describe('getAllCompanies', () => {
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

      // Create an update for Active Corp 1
      const company1 = await Company.findOne({ name: 'Active Corp 1' });
      await Update.create({
        userId: testUser._id,
        companyId: company1._id,
        type: 'daily',
        date: new Date(),
        rawInput: 'Test input',
        formattedOutput: 'Test output',
        sections: { todaysProgress: ['test'] }
      });
    });

    it('should get all active companies by default', async () => {
      await getAllCompanies(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 2,
          data: expect.arrayContaining([
            expect.objectContaining({ name: 'Active Corp 1' }),
            expect.objectContaining({ name: 'Active Corp 2' })
          ])
        })
      );
    });

    it('should include update counts', async () => {
      await getAllCompanies(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const company1 = response.data.find(c => c.name === 'Active Corp 1');

      expect(company1.updateCount).toBe(1);
    });

    it('should include inactive companies when requested', async () => {
      mockReq.query.includeInactive = 'true';

      await getAllCompanies(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 3
        })
      );
    });
  });

  describe('getCompanyById', () => {
    let testCompany;

    beforeEach(async () => {
      testCompany = await Company.create({
        userId: testUser._id,
        name: 'Test Corp'
      });

      // Create some updates for this company
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

    it('should get company by id', async () => {
      mockReq.params.id = testCompany._id.toString();

      await getCompanyById(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            name: 'Test Corp',
            updateCount: 1
          })
        })
      );
    });

    it('should return 404 for non-existent company', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011'; // Valid ObjectId but doesn't exist

      await getCompanyById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Company not found'
        })
      );
    });
  });

  describe('updateCompany', () => {
    let testCompany;

    beforeEach(async () => {
      testCompany = await Company.create({
        userId: testUser._id,
        name: 'Original Name',
        description: 'Original description'
      });
    });

    it('should update company successfully', async () => {
      mockReq.params.id = testCompany._id.toString();
      mockReq.body = {
        name: 'Updated Name',
        description: 'Updated description',
        color: '#00FF00'
      };

      await updateCompany(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Company updated successfully',
          data: expect.objectContaining({
            name: 'Updated Name',
            description: 'Updated description',
            color: '#00FF00'
          })
        })
      );
    });

    it('should update isActive status', async () => {
      mockReq.params.id = testCompany._id.toString();
      mockReq.body = {
        isActive: false
      };

      await updateCompany(mockReq, mockRes);

      const updatedCompany = await Company.findById(testCompany._id);
      expect(updatedCompany.isActive).toBe(false);
    });

    it('should fail with duplicate name', async () => {
      // Create another company
      await Company.create({
        userId: testUser._id,
        name: 'Existing Corp'
      });

      mockReq.params.id = testCompany._id.toString();
      mockReq.body = {
        name: 'Existing Corp'
      };

      await updateCompany(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'A company with this name already exists'
        })
      );
    });

    it('should return 404 for non-existent company', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      mockReq.body = {
        name: 'New Name'
      };

      await updateCompany(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Company not found'
        })
      );
    });
  });

  describe('deleteCompany', () => {
    let testCompany;

    beforeEach(async () => {
      testCompany = await Company.create({
        userId: testUser._id,
        name: 'Delete Me Corp'
      });

      // Create some updates for this company
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
      mockReq.params.id = testCompany._id.toString();

      await deleteCompany(mockReq, mockRes);

      const company = await Company.findById(testCompany._id);
      expect(company.isActive).toBe(false);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Company deactivated successfully'
        })
      );
    });

    it('should permanently delete company when requested', async () => {
      mockReq.params.id = testCompany._id.toString();
      mockReq.query.permanent = 'true';

      await deleteCompany(mockReq, mockRes);

      const company = await Company.findById(testCompany._id);
      expect(company).toBeNull();

      const updates = await Update.find({ companyId: testCompany._id });
      expect(updates.length).toBe(0);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Company and associated updates permanently deleted'
        })
      );
    });

    it('should return 404 for non-existent company', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';

      await deleteCompany(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Company not found'
        })
      );
    });
  });

  describe('getCompanyStats', () => {
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
      mockReq.params.id = testCompany._id.toString();

      await getCompanyStats(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            company: expect.objectContaining({
              name: 'Stats Corp'
            }),
            statistics: expect.objectContaining({
              totalUpdates: 3,
              dailyUpdates: 2,
              weeklyUpdates: 1
            })
          })
        })
      );
    });

    it('should return 404 for non-existent company', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';

      await getCompanyStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Company not found'
        })
      );
    });
  });
});
