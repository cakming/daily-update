/**
 * Behavioral tests for the Search page.
 * Exercises the initial ready state, a successful search (daily + weekly GET),
 * a no-results state, and the failing-fetch catch branches.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../../test-utils/mocks/server';
import { render, screen } from '../../test-utils/test-utils';
import Search from '../../pages/Search';

const seedAuth = () => {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem(
    'user',
    JSON.stringify({ _id: 'u1', name: 'Test User', email: 'test@example.com' })
  );
};

describe('Search page', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    seedAuth();
    server.use(
      http.get('*', () => HttpResponse.json({ success: true, data: [], count: 0 })),
      http.post('*', () => HttpResponse.json({ success: true, data: {} })),
      http.put('*', () => HttpResponse.json({ success: true, data: {} })),
      http.delete('*', () => HttpResponse.json({ success: true })),
      http.get('*/auth/me', () =>
        HttpResponse.json({
          success: true,
          data: { _id: 'u1', name: 'Test User', email: 'test@example.com' },
        })
      )
    );
  });

  it('renders the header and the initial ready-to-search state', async () => {
    render(<Search />);

    expect(
      screen.getByRole('heading', { name: /Advanced Search/ })
    ).toBeInTheDocument();
    expect(screen.getByText('Ready to search')).toBeInTheDocument();
  });

  it('performs a search and renders matching results', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/daily-updates', () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              _id: 'd1',
              content: 'Fixed the login bug',
              createdAt: new Date().toISOString(),
            },
          ],
        })
      )
    );

    render(<Search />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('1 result found')).toBeInTheDocument();
    expect(screen.getByText('Fixed the login bug')).toBeInTheDocument();
    expect(screen.getByText('Daily Update')).toBeInTheDocument();
  });

  it('shows the no-results state when fetches fail (catch branches)', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/daily-updates', () =>
        HttpResponse.json({ success: false }, { status: 500 })
      ),
      http.get('*/weekly-updates', () =>
        HttpResponse.json({ success: false }, { status: 500 })
      )
    );

    render(<Search />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('No results found')).toBeInTheDocument();
  });

  it('clears filters and returns to the ready state', async () => {
    const user = userEvent.setup();
    render(<Search />);

    await user.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByText('No results found');

    await user.click(screen.getByRole('button', { name: 'Clear Filters' }));

    expect(await screen.findByText('Ready to search')).toBeInTheDocument();
  });
});
