import { describe, it, expect } from '@jest/globals';
import { emailTemplates } from '../../../config/email.js';

/**
 * Unit tests for the real email templates (config/email.js). The route
 * integration tests mock this module, so these exercise the actual template
 * functions — in particular the weekly summary, which used to read the
 * non-existent `update.period.*` and threw a TypeError instead of rendering.
 */
const baseUser = { name: 'Test User', email: 'user@example.com' };

describe('emailTemplates (config/email.js)', () => {
  describe('weeklySummary', () => {
    it('renders the date range from dateRange (not the non-existent period field)', () => {
      const start = new Date('2026-01-05');
      const end = new Date('2026-01-11');
      const update = {
        companyId: { name: 'Acme' },
        dateRange: { start, end },
        aiSummary: 'Weekly recap',
        content: 'body',
        tags: [],
      };

      const out = emailTemplates.weeklySummary(update, baseUser);

      expect(out.subject).toContain('Acme');
      // Regression: reading update.period.startDate threw; the dates must render.
      expect(out.subject).toContain(start.toLocaleDateString());
      expect(out.subject).toContain(end.toLocaleDateString());
      expect(out.html).toContain('Weekly recap');
    });

    it('does not throw when company and dateRange are absent', () => {
      expect(() =>
        emailTemplates.weeklySummary({ tags: [] }, baseUser)
      ).not.toThrow();
    });
  });

  describe('dailyUpdate', () => {
    it('renders a subject with the company name', () => {
      const update = {
        companyId: { name: 'Globex' },
        createdAt: new Date('2026-01-05'),
        content: 'did things',
        tags: [],
      };

      const out = emailTemplates.dailyUpdate(update, baseUser);

      expect(out.subject).toContain('Globex');
    });

    it('falls back to "No Company" when companyId is not populated', () => {
      const out = emailTemplates.dailyUpdate(
        { createdAt: new Date('2026-01-05'), tags: [] },
        baseUser
      );
      expect(out.subject).toContain('No Company');
    });
  });
});
