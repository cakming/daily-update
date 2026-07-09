/**
 * Tests for the Analytics page.
 *
 * On mount it fetches GET /analytics/dashboard and GET /analytics/trends (plus
 * GET /companies via the embedded CompanySelector). We keep trends/company
 * breakdown empty so no recharts charts render (recharts needs real layout that
 * jsdom lacks), and assert the header, the Overview section and the stat cards
 * populated from the mocked dashboard response.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '../../test-utils/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import Analytics from '../../pages/Analytics';

const catchAll = [
  http.get('*', () => HttpResponse.json({ success: true, data: [] })),
  http.post('*', () => HttpResponse.json({ success: true, data: {} })),
  http.put('*', () => HttpResponse.json({ success: true, data: {} })),
  http.delete('*', () => HttpResponse.json({ success: true, data: {} })),
];

describe('Analytics page', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
  });

  it('renders the header immediately', () => {
    server.use(
      http.get('*/api/analytics/dashboard', () =>
        HttpResponse.json({ success: true, data: null })
      ),
      http.get('*/api/analytics/trends', () =>
        HttpResponse.json({ success: true, data: { daily: [], weekly: [] } })
      ),
      ...catchAll
    );

    render(<Analytics />);
    expect(
      screen.getByRole('heading', { name: 'Analytics Dashboard' })
    ).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('renders overview stats from the dashboard response', async () => {
    server.use(
      http.get('*/api/analytics/dashboard', () =>
        HttpResponse.json({
          success: true,
          data: {
            totalUpdates: 12,
            dailyUpdates: 9,
            weeklyUpdates: 3,
            companiesCount: 2,
            byCompany: [],
          },
        })
      ),
      http.get('*/api/analytics/trends', () =>
        HttpResponse.json({ success: true, data: { daily: [], weekly: [] } })
      ),
      ...catchAll
    );

    render(<Analytics />);

    expect(await screen.findByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Total Updates')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Weekly Summaries')).toBeInTheDocument();
  });

  it('shows the empty state when there is no dashboard data', async () => {
    server.use(
      http.get('*/api/analytics/dashboard', () =>
        HttpResponse.json({ success: true, data: null })
      ),
      http.get('*/api/analytics/trends', () =>
        HttpResponse.json({ success: true, data: { daily: [], weekly: [] } })
      ),
      ...catchAll
    );

    render(<Analytics />);
    expect(
      await screen.findByText('No analytics data available')
    ).toBeInTheDocument();
  });
});
