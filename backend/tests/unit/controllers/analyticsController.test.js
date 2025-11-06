import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
  getDashboard,
  getProductivityTrends,
} from '../../../controllers/analyticsController.js';
import Update from '../../../models/Update.js';

describe('Analytics Controller', () => {
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
    };
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    test('should return dashboard analytics successfully', async () => {
      const mockAggregateResult = [
        {
          type: 'daily',
          count: 10,
        },
        {
          type: 'weekly',
          count: 5,
        },
      ];

      const mockCompanyAggregateResult = [
        {
          _id: 'company1',
          name: 'Company A',
          color: '#FF0000',
          dailyCount: 5,
          weeklyCount: 2,
        },
      ];

      Update.aggregate
        .mockResolvedValueOnce(mockAggregateResult) // First call for type counts
        .mockResolvedValueOnce(mockCompanyAggregateResult); // Second call for company breakdown

      await getDashboard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          totalUpdates: expect.any(Number),
          dailyUpdates: expect.any(Number),
          weeklyUpdates: expect.any(Number),
        }),
      });
    });

    test('should filter by company when companyId provided', async () => {
      mockReq.query.companyId = 'company123';

      Update.aggregate
        .mockResolvedValueOnce([{ type: 'daily', count: 3 }])
        .mockResolvedValueOnce([]);

      await getDashboard(mockReq, mockRes);

      expect(Update.aggregate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter by date range when provided', async () => {
      mockReq.query.startDate = '2025-11-01';
      mockReq.query.endDate = '2025-11-30';

      Update.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getDashboard(mockReq, mockRes);

      expect(Update.aggregate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle errors gracefully', async () => {
      Update.aggregate.mockRejectedValueOnce(new Error('Database error'));

      await getDashboard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch dashboard analytics',
      });
    });
  });

  describe('getProductivityTrends', () => {
    test('should return trends analytics successfully', async () => {
      const mockDailyTrends = [
        { _id: '2025-11-01', count: 2 },
        { _id: '2025-11-02', count: 3 },
      ];

      const mockWeeklyTrends = [
        { _id: '2025-11-01', count: 1 },
      ];

      Update.aggregate
        .mockResolvedValueOnce(mockDailyTrends)
        .mockResolvedValueOnce(mockWeeklyTrends);

      await getProductivityTrends(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          daily: mockDailyTrends,
          weekly: mockWeeklyTrends,
        },
      });
    });

    test('should filter trends by company', async () => {
      mockReq.query.companyId = 'company123';

      Update.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getProductivityTrends(mockReq, mockRes);

      expect(Update.aggregate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should filter trends by date range', async () => {
      mockReq.query.startDate = '2025-11-01';
      mockReq.query.endDate = '2025-11-30';

      Update.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getProductivityTrends(mockReq, mockRes);

      expect(Update.aggregate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should limit results when limit parameter provided', async () => {
      mockReq.query.limit = '10';

      Update.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getProductivityTrends(mockReq, mockRes);

      expect(Update.aggregate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle errors gracefully', async () => {
      Update.aggregate.mockRejectedValueOnce(new Error('Database error'));

      await getProductivityTrends(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch trends analytics',
      });
    });
  });
});
