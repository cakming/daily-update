/**
 * Behavioral tests for the Login page.
 *
 * Covers: the form renders (heading + Login/Register tabs + Email/Password
 * fields), a valid login drives the mocked POST /auth/login and surfaces the
 * success toast, and an invalid login surfaces the error toast. The default
 * MSW auth handlers accept test@example.com / password123 and 401 anything
 * else, so no per-test handlers are needed here.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../test-utils/test-utils';
import Login from '../../pages/Login';

describe('Login page', () => {
  beforeEach(() => {
    // setup.js mocks window.location with an empty href; MSW's XHR interceptor
    // resolves request URLs against it, so give it a valid origin or requests
    // throw "Invalid base URL" before they can be mocked.
    window.location.href = 'http://localhost:3000/';
  });

  it('renders the heading, tabs and login form fields', () => {
    render(<Login />);

    expect(
      screen.getByRole('heading', { name: 'Daily Update App' })
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Register' })).toBeInTheDocument();
    // Login panel exposes an Email + Password field and a submit button.
    expect(screen.getAllByText('Email').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Password').length).toBeGreaterThan(0);
    expect(screen.getAllByPlaceholderText('your@email.com').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('submits a valid login and shows the success toast', async () => {
    const user = userEvent.setup();
    render(<Login />);

    // Login panel is the first tab, so its fields are the first matches.
    await user.type(screen.getAllByPlaceholderText('your@email.com')[0], 'test@example.com');
    await user.type(screen.getAllByPlaceholderText('••••••••')[0], 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    // Success toast confirms the API round-trip succeeded (no error surfaced).
    expect(await screen.findByText('Login successful')).toBeInTheDocument();
    expect(screen.queryByText('Login failed')).not.toBeInTheDocument();
  });

  it('shows an error toast when credentials are invalid', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getAllByPlaceholderText('your@email.com')[0], 'wrong@example.com');
    await user.type(screen.getAllByPlaceholderText('••••••••')[0], 'badpassword');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Login failed')).toBeInTheDocument();
    // The API's message is passed through to the toast description.
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });
});
