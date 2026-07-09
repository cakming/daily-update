/**
 * Tests for the ForgotPassword page (public, no auth needed).
 *
 * Covers the form rendering, a successful submit (POST /auth/forgot-password)
 * flipping to the "Check Your Email" confirmation screen, and an API error
 * surfacing the error toast.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../test-utils/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import ForgotPassword from '../../pages/ForgotPassword';

const catchAll = [
  http.get('*', () => HttpResponse.json({ success: true, data: [] })),
  http.post('*', () => HttpResponse.json({ success: true, data: {} })),
  http.put('*', () => HttpResponse.json({ success: true, data: {} })),
  http.delete('*', () => HttpResponse.json({ success: true, data: {} })),
];

describe('ForgotPassword page', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    server.use(...catchAll);
  });

  it('renders the form', () => {
    render(<ForgotPassword />);
    expect(screen.getByRole('heading', { name: 'Forgot Password?' })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('your.email@example.com')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
  });

  it('shows the confirmation screen after a successful submit', async () => {
    server.use(
      http.post('*/api/auth/forgot-password', () =>
        HttpResponse.json({ success: true, message: 'sent' })
      ),
      ...catchAll
    );

    const user = userEvent.setup();
    render(<ForgotPassword />);

    await user.type(
      screen.getByPlaceholderText('your.email@example.com'),
      'me@example.com'
    );
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(
      await screen.findByRole('heading', { name: 'Check Your Email' })
    ).toBeInTheDocument();
  });

  it('surfaces an error toast when the API fails', async () => {
    server.use(
      http.post('*/api/auth/forgot-password', () =>
        HttpResponse.json(
          { success: false, message: 'Server exploded' },
          { status: 500 }
        )
      ),
      ...catchAll
    );

    const user = userEvent.setup();
    render(<ForgotPassword />);

    await user.type(
      screen.getByPlaceholderText('your.email@example.com'),
      'me@example.com'
    );
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
    // Should stay on the form, not advance to the confirmation screen.
    expect(
      screen.queryByRole('heading', { name: 'Check Your Email' })
    ).not.toBeInTheDocument();
  });
});
