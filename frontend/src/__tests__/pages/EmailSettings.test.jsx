/**
 * Behavioral tests for the EmailSettings page.
 * Exercises the configured/not-configured status render, the send-test POST
 * flow, client-side email validation, and the send error branch.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../../test-utils/mocks/server';
import { render, screen } from '../../test-utils/test-utils';
import EmailSettings from '../../pages/EmailSettings';

const seedAuth = () => {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem(
    'user',
    JSON.stringify({ _id: 'u1', name: 'Test User', email: 'test@example.com' })
  );
};

const configured = (isConfigured) =>
  http.get('*/email/config-status', () =>
    HttpResponse.json({
      success: true,
      data: {
        configured: isConfigured,
        message: isConfigured ? 'SMTP is ready to go' : 'Not configured',
      },
    })
  );

describe('EmailSettings page', () => {
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

  it('renders the configured status from a mocked GET', async () => {
    server.use(configured(true));
    render(<EmailSettings />);

    expect(
      screen.getByRole('heading', { name: /Email Settings/ })
    ).toBeInTheDocument();
    expect(await screen.findByText('Configured')).toBeInTheDocument();
    expect(screen.getByText('SMTP is ready to go')).toBeInTheDocument();
  });

  it('renders the not-configured status and guidance', async () => {
    server.use(configured(false));
    render(<EmailSettings />);

    expect(await screen.findByText('Not Configured')).toBeInTheDocument();
    expect(
      screen.getByText('Email service not configured')
    ).toBeInTheDocument();
  });

  it('sends a test email and shows a success toast', async () => {
    const user = userEvent.setup();
    server.use(configured(true));
    render(<EmailSettings />);

    await screen.findByText('Configured');

    const input = screen.getByPlaceholderText('recipient@example.com');
    await user.type(input, 'someone@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Test' }));

    expect(await screen.findByText('Test email sent')).toBeInTheDocument();
  });

  it('rejects an invalid email address', async () => {
    const user = userEvent.setup();
    server.use(configured(true));
    render(<EmailSettings />);

    await screen.findByText('Configured');

    const input = screen.getByPlaceholderText('recipient@example.com');
    await user.type(input, 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send Test' }));

    expect(await screen.findByText('Invalid email')).toBeInTheDocument();
  });

  it('shows an error toast when sending the test email fails', async () => {
    const user = userEvent.setup();
    server.use(
      configured(true),
      http.post('*/email/test', () =>
        HttpResponse.json({ success: false, message: 'SMTP error' }, { status: 500 })
      )
    );
    render(<EmailSettings />);

    await screen.findByText('Configured');

    const input = screen.getByPlaceholderText('recipient@example.com');
    await user.type(input, 'someone@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Test' }));

    expect(
      await screen.findByText('Failed to send test email')
    ).toBeInTheDocument();
  });
});
