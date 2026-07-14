/**
 * Tests for the public (unauthenticated) shared-update view. The token comes
 * from useParams; rendered directly it is undefined, and the request is matched
 * by a wildcard handler — enough to exercise the loaded and not-found states.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '../../test-utils/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import PublicUpdate from '../../pages/PublicUpdate';

describe('PublicUpdate page', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
  });

  it('renders a shared weekly summary read-only', async () => {
    server.use(
      http.get('*/api/public/updates/*', () =>
        HttpResponse.json({
          success: true,
          data: {
            type: 'weekly',
            title: 'Weekly Summary',
            company: 'Acme',
            dateRange: { start: '2026-01-05', end: '2026-01-11' },
            formattedOutput: 'This week we shipped the sharing feature.',
            tags: ['sprint'],
          },
        })
      )
    );

    render(<PublicUpdate />);

    expect(
      await screen.findByText('This week we shipped the sharing feature.')
    ).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('sprint')).toBeInTheDocument();
  });

  it('shows a not-found state when the token does not resolve', async () => {
    server.use(
      http.get('*/api/public/updates/*', () =>
        HttpResponse.json({ success: false }, { status: 404 })
      )
    );

    render(<PublicUpdate />);

    expect(await screen.findByText('Link not found')).toBeInTheDocument();
  });
});
