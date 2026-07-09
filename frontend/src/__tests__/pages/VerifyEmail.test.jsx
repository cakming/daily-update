/**
 * Tests for the VerifyEmail page (public; verificationToken comes from
 * useParams and is undefined when rendered directly).
 *
 * On mount it calls GET /auth/verify-email/:token and renders a success or
 * failure state based on the response. We cover both outcomes.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '../../test-utils/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import VerifyEmail from '../../pages/VerifyEmail';

const catchAll = [
  http.get('*', () => HttpResponse.json({ success: true, data: [] })),
  http.post('*', () => HttpResponse.json({ success: true, data: {} })),
  http.put('*', () => HttpResponse.json({ success: true, data: {} })),
  http.delete('*', () => HttpResponse.json({ success: true, data: {} })),
];

describe('VerifyEmail page', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
  });

  it('shows the success state when verification succeeds', async () => {
    server.use(
      http.get('*/api/auth/verify-email/*', () =>
        HttpResponse.json({ success: true, message: 'Your email is verified' })
      ),
      ...catchAll
    );

    render(<VerifyEmail />);

    expect(
      await screen.findByRole('heading', { name: 'Email Verified!' })
    ).toBeInTheDocument();
    expect(screen.getByText('Your email is verified')).toBeInTheDocument();
  });

  it('shows the failure state when verification fails', async () => {
    server.use(
      http.get('*/api/auth/verify-email/*', () =>
        HttpResponse.json(
          { success: false, message: 'Link expired' },
          { status: 400 }
        )
      ),
      ...catchAll
    );

    render(<VerifyEmail />);

    expect(
      await screen.findByRole('heading', { name: 'Verification Failed' })
    ).toBeInTheDocument();
    expect(screen.getByText('Link expired')).toBeInTheDocument();
  });
});
