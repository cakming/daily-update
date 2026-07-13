/**
 * Behavioral test for the History page.
 *
 * Covers: the daily update list renders from the mocked GET /daily-updates,
 * and typing in the "Search updates..." box filters the list down (History
 * filters client-side against rawInput + formattedOutput).
 *
 * We register a specific GET /daily-updates returning two distinct updates,
 * an empty GET /weekly-updates, and a catch-all GET for the child selectors'
 * on-mount fetches (companies, tags, teams). These specific handlers are
 * listed before the catch-all so they win (msw uses the first matching
 * handler).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../../test-utils/mocks/server';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import History from '../../pages/History';

const now = new Date().toISOString();

const DAILY_UPDATES = [
  {
    _id: 'a1',
    userId: 'mock-user-id',
    type: 'daily',
    date: now,
    rawInput: 'alpha raw',
    formattedOutput: 'Alpha project update complete',
    sections: {},
    createdAt: now,
  },
  {
    _id: 'b2',
    userId: 'mock-user-id',
    type: 'daily',
    date: now,
    rawInput: 'beta raw',
    formattedOutput: 'Beta release notes summary',
    sections: {},
    createdAt: now,
  },
];

describe('History page', () => {
  beforeEach(() => {
    // setup.js mocks window.location with an empty href; MSW's XHR interceptor
    // resolves request URLs against it, so give it a valid origin or requests
    // throw "Invalid base URL" before they can be mocked.
    window.location.href = 'http://localhost:3000/';
    server.use(
      http.get('http://localhost:5000/api/daily-updates', () =>
        HttpResponse.json({
          success: true,
          count: DAILY_UPDATES.length,
          data: DAILY_UPDATES,
        })
      ),
      http.get('http://localhost:5000/api/weekly-updates', () =>
        HttpResponse.json({ success: true, count: 0, data: [] })
      ),
      // Catch-all for child selectors (companies, tags, teams, etc.).
      http.get('*', () =>
        HttpResponse.json({ success: true, data: [], count: 0 })
      )
    );
  });

  it('renders the update list from the API', async () => {
    render(<History />);

    expect(
      await screen.findByText('Alpha project update complete')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Beta release notes summary')
    ).toBeInTheDocument();
  });

  it('shows the Chat button when Google Chat is linked and sends the update', async () => {
    const user = userEvent.setup();
    let postedId = null;
    server.use(
      http.get('http://localhost:5000/api/integrations/googlechat/status', () =>
        HttpResponse.json({ success: true, data: { linked: true } })
      ),
      http.post(
        'http://localhost:5000/api/integrations/googlechat/daily/a1',
        () => {
          postedId = 'a1';
          return HttpResponse.json({
            success: true,
            message: 'Daily update sent to Google Chat',
          });
        }
      )
    );

    render(<History />);
    await screen.findByText('Alpha project update complete');

    // One "Chat" button per update; click the first one.
    const chatButtons = await screen.findAllByRole('button', { name: 'Chat' });
    await user.click(chatButtons[0]);

    await waitFor(() => expect(postedId).toBe('a1'));
    expect(await screen.findByText('Sent to Google Chat')).toBeInTheDocument();
  });

  it('hides the Chat button when Google Chat is not linked', async () => {
    server.use(
      http.get('http://localhost:5000/api/integrations/googlechat/status', () =>
        HttpResponse.json({ success: true, data: { linked: false } })
      )
    );

    render(<History />);
    await screen.findByText('Alpha project update complete');

    expect(
      screen.queryByRole('button', { name: 'Chat' })
    ).not.toBeInTheDocument();
  });

  it('filters the list via the search box', async () => {
    const user = userEvent.setup();
    render(<History />);

    // Both are present initially.
    await screen.findByText('Alpha project update complete');
    expect(screen.getByText('Beta release notes summary')).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText('Search updates...'),
      'Alpha'
    );

    // The non-matching update is filtered out; the matching one stays.
    await waitFor(() => {
      expect(
        screen.queryByText('Beta release notes summary')
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByText('Alpha project update complete')
    ).toBeInTheDocument();
  });
});
