import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
  getExportMetadata,
  exportAsCSV,
  exportAsJSON,
  exportAsMarkdown,
} from '../../../controllers/exportController.js';
import Update from '../../../models/Update.js';
import Company from '../../../models/Company.js';

describe('Export Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      user: { _id: 'user123' },
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('getExportMetadata', () => {
    test('should return export metadata successfully', async () => {
      Update.countDocuments
        .mockResolvedValueOnce(10) // daily count
        .mockResolvedValueOnce(5); // weekly count

      await getExportMetadata(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalUpdates: 15,
          dailyUpdates: 10,
          weeklyUpdates: 5,
          availableFormats: ['CSV', 'JSON', 'Markdown'],
        },
      });
    });

    test('should filter metadata by company', async () => {
      mockReq.query.companyId = 'company123';

      Update.countDocuments
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);

      await getExportMetadata(mockReq, mockRes);

      expect(Update.countDocuments).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle errors gracefully', async () => {
      Update.countDocuments.mockRejectedValueOnce(new Error('Database error'));

      await getExportMetadata(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch export metadata',
      });
    });
  });

  describe('exportAsCSV', () => {
    test('should export updates to CSV successfully', async () => {
      const mockUpdates = [
        {
          type: 'daily',
          date: new Date('2025-11-06'),
          formattedOutput: 'Test output 1',
          companyId: null,
          createdAt: new Date('2025-11-06'),
        },
        {
          type: 'weekly',
          dateRange: {
            start: new Date('2025-11-01'),
            end: new Date('2025-11-07'),
          },
          formattedOutput: 'Test output 2',
          companyId: 'company123',
          createdAt: new Date('2025-11-07'),
        },
      ];

      Update.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockUpdates),
        }),
      });

      await exportAsCSV(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename=daily-updates')
      );
      expect(mockRes.send).toHaveBeenCalled();
    });

    test('should handle empty results', async () => {
      Update.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      await exportAsCSV(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining('Type,Date')
      );
    });

    test('should handle errors gracefully', async () => {
      Update.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      await exportAsCSV(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to export to CSV',
      });
    });
  });

  describe('exportAsJSON', () => {
    test('should export updates to JSON successfully', async () => {
      const mockUpdates = [
        {
          type: 'daily',
          date: new Date('2025-11-06'),
          formattedOutput: 'Test output',
          rawInput: 'Test input',
        },
      ];

      Update.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockUpdates),
        }),
      });

      await exportAsJSON(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename=daily-updates')
      );
      expect(mockRes.send).toHaveBeenCalled();
    });

    test('should filter by type when provided', async () => {
      mockReq.query.type = 'daily';

      Update.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      await exportAsJSON(mockReq, mockRes);

      expect(Update.find).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'daily' })
      );
    });

    test('should handle errors gracefully', async () => {
      Update.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      await exportAsJSON(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to export to JSON',
      });
    });
  });

  describe('exportAsMarkdown', () => {
    test('should export updates to Markdown successfully', async () => {
      const mockUpdates = [
        {
          type: 'daily',
          date: new Date('2025-11-06'),
          formattedOutput: 'Test output',
          companyId: null,
        },
      ];

      Update.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockUpdates),
        }),
      });

      await exportAsMarkdown(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/markdown'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename=daily-updates')
      );
      expect(mockRes.send).toHaveBeenCalled();
    });

    test('should include company name in markdown when available', async () => {
      const mockUpdates = [
        {
          type: 'daily',
          date: new Date('2025-11-06'),
          formattedOutput: 'Test output',
          companyId: {
            _id: 'company123',
            name: 'Company A',
          },
        },
      ];

      Update.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockUpdates),
        }),
      });

      await exportAsMarkdown(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalled();
      const sentData = mockRes.send.mock.calls[0][0];
      expect(sentData).toContain('Company A');
    });

    test('should filter by date range when provided', async () => {
      mockReq.query.startDate = '2025-11-01';
      mockReq.query.endDate = '2025-11-30';

      Update.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      await exportAsMarkdown(mockReq, mockRes);

      expect(Update.find).toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      Update.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      await exportAsMarkdown(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to export to Markdown',
      });
    });
  });
});
