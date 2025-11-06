import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import Company from '../../../models/Company.js';
import User from '../../../models/User.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';

describe('Company Model', () => {
  let testUser;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  beforeEach(async () => {
    // Create a test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
  });

  describe('Company Creation', () => {
    it('should create a company with valid data', async () => {
      const companyData = {
        userId: testUser._id,
        name: 'Acme Corp',
        description: 'A test company',
        color: '#FF5733'
      };

      const company = await Company.create(companyData);

      expect(company).toBeDefined();
      expect(company.name).toBe('Acme Corp');
      expect(company.description).toBe('A test company');
      expect(company.color).toBe('#FF5733');
      expect(company.userId.toString()).toBe(testUser._id.toString());
      expect(company.isActive).toBe(true);
      expect(company.createdAt).toBeDefined();
    });

    it('should create a company with default color', async () => {
      const companyData = {
        userId: testUser._id,
        name: 'Default Color Corp'
      };

      const company = await Company.create(companyData);

      expect(company.color).toBe('#3182CE'); // Default blue color
    });

    it('should create a company without description', async () => {
      const companyData = {
        userId: testUser._id,
        name: 'No Description Corp'
      };

      const company = await Company.create(companyData);

      expect(company).toBeDefined();
      expect(company.description).toBeUndefined();
    });

    it('should fail without required userId', async () => {
      const companyData = {
        name: 'No User Corp'
      };

      await expect(Company.create(companyData)).rejects.toThrow();
    });

    it('should fail without required name', async () => {
      const companyData = {
        userId: testUser._id
      };

      await expect(Company.create(companyData)).rejects.toThrow();
    });

    it('should trim whitespace from name', async () => {
      const companyData = {
        userId: testUser._id,
        name: '  Trimmed Corp  '
      };

      const company = await Company.create(companyData);

      expect(company.name).toBe('Trimmed Corp');
    });

    it('should fail with invalid color format', async () => {
      const companyData = {
        userId: testUser._id,
        name: 'Invalid Color Corp',
        color: 'not-a-color'
      };

      await expect(Company.create(companyData)).rejects.toThrow();
    });

    it('should fail with name exceeding 100 characters', async () => {
      const companyData = {
        userId: testUser._id,
        name: 'A'.repeat(101)
      };

      await expect(Company.create(companyData)).rejects.toThrow();
    });

    it('should fail with description exceeding 500 characters', async () => {
      const companyData = {
        userId: testUser._id,
        name: 'Long Description Corp',
        description: 'A'.repeat(501)
      };

      await expect(Company.create(companyData)).rejects.toThrow();
    });
  });

  describe('Company Uniqueness', () => {
    it('should prevent duplicate company names for the same user', async () => {
      const companyData = {
        userId: testUser._id,
        name: 'Unique Corp'
      };

      await Company.create(companyData);

      // Try to create another company with the same name for the same user
      await expect(Company.create(companyData)).rejects.toThrow();
    });

    it('should allow same company name for different users', async () => {
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123'
      });

      const companyData1 = {
        userId: testUser._id,
        name: 'Shared Name Corp'
      };

      const companyData2 = {
        userId: anotherUser._id,
        name: 'Shared Name Corp'
      };

      const company1 = await Company.create(companyData1);
      const company2 = await Company.create(companyData2);

      expect(company1.name).toBe(company2.name);
      expect(company1._id).not.toBe(company2._id);
    });
  });

  describe('Company Updates', () => {
    it('should update company fields', async () => {
      const company = await Company.create({
        userId: testUser._id,
        name: 'Original Name'
      });

      company.name = 'Updated Name';
      company.description = 'New description';
      company.color = '#00FF00';
      await company.save();

      const updatedCompany = await Company.findById(company._id);
      expect(updatedCompany.name).toBe('Updated Name');
      expect(updatedCompany.description).toBe('New description');
      expect(updatedCompany.color).toBe('#00FF00');
    });

    it('should update updatedAt timestamp on save', async () => {
      const company = await Company.create({
        userId: testUser._id,
        name: 'Timestamp Corp'
      });

      const originalUpdatedAt = company.updatedAt;

      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 10));
      company.description = 'Updated description';
      await company.save();

      expect(company.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should allow deactivating a company', async () => {
      const company = await Company.create({
        userId: testUser._id,
        name: 'Active Corp'
      });

      expect(company.isActive).toBe(true);

      company.isActive = false;
      await company.save();

      const deactivatedCompany = await Company.findById(company._id);
      expect(deactivatedCompany.isActive).toBe(false);
    });
  });

  describe('Company Queries', () => {
    beforeEach(async () => {
      // Create multiple companies for testing
      await Company.create({
        userId: testUser._id,
        name: 'Alpha Corp',
        isActive: true
      });

      await Company.create({
        userId: testUser._id,
        name: 'Beta Corp',
        isActive: false
      });

      await Company.create({
        userId: testUser._id,
        name: 'Gamma Corp',
        isActive: true
      });
    });

    it('should find all companies for a user', async () => {
      const companies = await Company.find({ userId: testUser._id });
      expect(companies.length).toBe(3);
    });

    it('should find only active companies', async () => {
      const activeCompanies = await Company.find({
        userId: testUser._id,
        isActive: true
      });
      expect(activeCompanies.length).toBe(2);
    });

    it('should find company by name and userId', async () => {
      const company = await Company.findOne({
        userId: testUser._id,
        name: 'Alpha Corp'
      });

      expect(company).toBeDefined();
      expect(company.name).toBe('Alpha Corp');
    });
  });

  describe('Company Deletion', () => {
    it('should delete a company', async () => {
      const company = await Company.create({
        userId: testUser._id,
        name: 'Delete Me Corp'
      });

      await Company.deleteOne({ _id: company._id });

      const deletedCompany = await Company.findById(company._id);
      expect(deletedCompany).toBeNull();
    });
  });
});
