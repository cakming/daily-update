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
        type: 'weekly',
        companyId: { name: 'Acme' },
        dateRange: { start, end },
        formattedOutput: 'Weekly recap',
        tags: [],
        dailyUpdates: ['a', 'b', 'c'],
      };

      const out = emailTemplates.weeklySummary(update, baseUser);

      expect(out.subject).toContain('Acme');
      // Regression: reading update.period.startDate threw; the dates must render.
      expect(out.subject).toContain(start.toLocaleDateString());
      expect(out.subject).toContain(end.toLocaleDateString());
      expect(out.html).toContain('Weekly recap');
      // The linked daily-update count renders (was always 0 before the field existed).
      expect(out.html).toContain('Updates Included: 3');
    });

    it('does not throw when company and dateRange are absent', () => {
      expect(() =>
        emailTemplates.weeklySummary({ type: 'weekly', tags: [] }, baseUser)
      ).not.toThrow();
    });
  });

  describe('dailyUpdate', () => {
    it('renders the company name and the formatted output as the body', () => {
      const update = {
        companyId: { name: 'Globex' },
        date: new Date('2026-01-05'),
        formattedOutput: 'The full formatted daily update',
        aiSummary: 'Short summary',
        tags: [{ name: 'backend' }],
      };

      const out = emailTemplates.dailyUpdate(update, baseUser);

      expect(out.subject).toContain('Globex');
      expect(out.html).toContain('The full formatted daily update');
      expect(out.html).toContain('backend');
    });

    it('uses the short aiSummary in summary mode', () => {
      const update = {
        companyId: { name: 'Globex' },
        date: new Date('2026-01-05'),
        formattedOutput: 'The full formatted daily update',
        aiSummary: 'Short summary',
        tags: [],
      };

      const full = emailTemplates.dailyUpdate(update, baseUser, { summaryMode: 'full' });
      expect(full.html).toContain('The full formatted daily update');

      const summary = emailTemplates.dailyUpdate(update, baseUser, { summaryMode: 'summary' });
      expect(summary.html).toContain('Short summary');
      expect(summary.html).not.toContain('The full formatted daily update');
    });

    it('falls back to "No Company" when companyId is not populated', () => {
      const out = emailTemplates.dailyUpdate(
        { date: new Date('2026-01-05'), formattedOutput: 'x', tags: [] },
        baseUser
      );
      expect(out.subject).toContain('No Company');
    });
  });

  describe('digest', () => {
    it('rolls up multiple updates with company, date and body', () => {
      const updates = [
        {
          type: 'daily',
          companyId: { name: 'Acme' },
          date: new Date('2026-01-05'),
          formattedOutput: 'Did the first thing',
          tags: [],
        },
        {
          type: 'weekly',
          companyId: { name: 'Globex' },
          dateRange: { start: new Date('2026-01-01'), end: new Date('2026-01-07') },
          formattedOutput: 'Summed up the week',
          tags: [],
        },
      ];

      const out = emailTemplates.digest('daily', updates, baseUser);

      expect(out.subject).toContain('2 updates');
      expect(out.html).toContain('Acme');
      expect(out.html).toContain('Did the first thing');
      expect(out.html).toContain('Globex');
      expect(out.text).toContain('Summed up the week');
    });

    it('singularizes the subject for one update', () => {
      const out = emailTemplates.digest(
        'weekly',
        [{ type: 'weekly', dateRange: {}, formattedOutput: 'x', tags: [] }],
        baseUser
      );
      expect(out.subject).toContain('1 update');
      expect(out.subject).not.toContain('1 updates');
    });
  });
});
