/**
 * Tests for the ResetPassword page (public; resetToken comes from useParams and
 * is undefined when rendered directly — the request just uses it and the mock
 * responds).
 *
 * Covers form rendering, client-side password-mismatch validation, and a
 * successful reset (PUT /auth/reset-password/:token) surfacing the success
 * toast.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../test-utils/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import ResetPassword from '../../pages/ResetPassword';

const catchAll = [
  http.get('*', () => HttpResponse.json({ success: true, data: [] })),
  http.post('*', () => HttpResponse.json({ success: true, data: {} })),
  http.put('*', () => HttpResponse.json({ success: true, data: {} })),
  http.delete('*', () => HttpResponse.json({ success: true, data: {} })),
];

describe('ResetPassword page', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    server.use(...catchAll);
  });

  it('renders the reset form', () => {
    render(<ResetPassword />);
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('At least 6 characters')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Re-enter password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('rejects mismatched passwords with a validation toast', async () => {
    const user = userEvent.setup();
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText('At least 6 characters'), 'secret1');
    await user.type(screen.getByPlaceholderText('Re-enter password'), 'secret2');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });

  it('resets the password successfully', async () => {
    server.use(
      http.put('*/api/auth/reset-password/*', () =>
        HttpResponse.json({
          success: true,
          data: { token: 'new-token', _id: 'u1', name: 'A', email: 'a@b.c' },
        })
      ),
      ...catchAll
    );

    const user = userEvent.setup();
    render(<ResetPassword />);

    await user.type(screen.getByPlaceholderText('At least 6 characters'), 'secret123');
    await user.type(screen.getByPlaceholderText('Re-enter password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByText('Password reset successful')).toBeInTheDocument();
  });
});
