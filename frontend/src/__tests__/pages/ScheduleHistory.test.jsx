/**
 * Behavioral tests for the ScheduleHistory page.
 *
 * Covers: statistics + history table render from GET /schedule-history/stats
 * and GET /schedule-history, changing the Status filter (re-fetches with a
 * status param and swaps the rows), and the history load error branch.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../../test-utils/mocks/server';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import ScheduleHistory from '../../pages/ScheduleHistory';

const API = 'http://localhost:5000/api';

const STATS = {
  totalExecutions: 12,
  successRate: 75,
  successCount: 9,
  failedCount: 2,
  partialCount: 1,
  avgExecutionTime: 1500,
  dailyStats: [],
};

const historyItem = (over = {}) => ({
  _id: 'h1',
  status: 'success',
  metadata: { scheduleName: 'Daily Standup', frequency: 'daily' },
  executedAt: new Date().toISOString(),
  executionTimeMs: 1500,
  emailSent: true,
  ...over,
});

function seedAuth() {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem(
    'user',
    JSON.stringify({ _id: 'u1', name: 'Test User', email: 'test@example.com' })
  );
}

describe('ScheduleHistory page', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    seedAuth();
    server.use(
      http.get('*/auth/me', () =>
        HttpResponse.json({
          success: true,
          data: { _id: 'u1', name: 'Test User', email: 'test@example.com' },
        })
      ),
      http.get(`${API}/schedule-history/stats`, () =>
        HttpResponse.json({ success: true, data: STATS })
      ),
      http.get('*', () => HttpResponse.json({ success: true, data: [], count: 0 })),
      http.post('*', () => HttpResponse.json({ success: true, data: {} })),
      http.put('*', () => HttpResponse.json({ success: true, data: {} })),
      http.delete('*', () => HttpResponse.json({ success: true }))
    );
  });

  it('renders statistics and a history row from the API', async () => {
    server.use(
      http.get(`${API}/schedule-history`, () =>
        HttpResponse.json({ success: true, data: [historyItem()] })
      )
    );

    render(<ScheduleHistory />);

    expect(
      await screen.findByRole('heading', { name: /Schedule Execution History/ })
    ).toBeInTheDocument();
    expect(await screen.findByText('Daily Standup')).toBeInTheDocument();
    expect(screen.getByText('Total Executions')).toBeInTheDocument();
  });

  it('re-fetches history when the status filter changes', async () => {
    server.use(
      http.get(`${API}/schedule-history`, ({ request }) => {
        const status = new URL(request.url).searchParams.get('status');
        if (status === 'failed') {
          return HttpResponse.json({
            success: true,
            data: [
              historyItem({
                _id: 'h2',
                status: 'failed',
                metadata: { scheduleName: 'Failed Job', frequency: 'weekly' },
              }),
            ],
          });
        }
        return HttpResponse.json({ success: true, data: [historyItem()] });
      })
    );

    const user = userEvent.setup();
    render(<ScheduleHistory />);
    await screen.findByText('Daily Standup');

    // Comboboxes in order: Schedule, Status, Stats Period.
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[1], 'failed');

    expect(await screen.findByText('Failed Job')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText('Daily Standup')).not.toBeInTheDocument()
    );
  });

  it('shows an error toast when history fails to load', async () => {
    server.use(
      http.get(`${API}/schedule-history`, () =>
        HttpResponse.json({ success: false, message: 'boom' }, { status: 500 })
      )
    );

    render(<ScheduleHistory />);

    expect(
      await screen.findByText('Failed to load schedule history')
    ).toBeInTheDocument();
  });
});
