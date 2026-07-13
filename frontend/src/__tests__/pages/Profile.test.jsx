/**
 * Tests for the Profile page (protected — reads the user from AuthContext).
 *
 * We seed a token + user in localStorage and override GET /auth/me so the
 * AuthProvider hydrates a user; the page then fetches daily/weekly counts for
 * the stats tab (handled by the catch-all). We assert the page renders the
 * user's details and that client-side password-mismatch validation surfaces a
 * toast before any request is made.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../test-utils/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import Profile from '../../pages/Profile';

const testUser = {
  _id: 'u1',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: true,
};

const catchAll = [
  http.get('*', () => HttpResponse.json({ success: true, data: [] })),
  http.post('*', () => HttpResponse.json({ success: true, data: {} })),
  http.put('*', () => HttpResponse.json({ success: true, data: {} })),
  http.delete('*', () => HttpResponse.json({ success: true, data: {} })),
];

describe('Profile page', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', JSON.stringify(testUser));
    server.use(
      http.get('*/api/auth/me', () =>
        HttpResponse.json({ success: true, data: testUser })
      ),
      ...catchAll
    );
  });

  it('renders the profile header and the hydrated user details', async () => {
    render(<Profile />);

    expect(
      screen.getByRole('heading', { name: 'Profile Settings' })
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Account Settings' })).toBeInTheDocument();
    // Name input is prefilled once the AuthProvider resolves the user.
    expect(await screen.findByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('validates that new passwords match before submitting', async () => {
    render(<Profile />);
    // Wait for the user to hydrate so the form is populated.
    await screen.findByDisplayValue('Test User');

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText('At least 6 characters'),
      'newpass1'
    );
    await user.type(
      screen.getByPlaceholderText('Re-enter new password'),
      'newpass2'
    );
    await user.click(screen.getByRole('button', { name: 'Update Profile' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });
});
