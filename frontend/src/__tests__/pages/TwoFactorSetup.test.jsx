/**
 * Tests for the TwoFactorSetup page.
 *
 * On mount it checks GET /auth/2fa/status. When 2FA is disabled it shows the
 * intro/step-1 screen; clicking "Enable 2FA" drives POST /auth/2fa/setup and
 * advances to the QR/secret step. When already enabled it jumps to the active
 * state. We seed a token so the axios interceptor doesn't treat requests as
 * unauthenticated.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../test-utils/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import TwoFactorSetup from '../../pages/TwoFactorSetup';

const catchAll = [
  http.get('*', () => HttpResponse.json({ success: true, data: [] })),
  http.post('*', () => HttpResponse.json({ success: true, data: {} })),
  http.put('*', () => HttpResponse.json({ success: true, data: {} })),
  http.delete('*', () => HttpResponse.json({ success: true, data: {} })),
];

describe('TwoFactorSetup page', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    localStorage.setItem('token', 'tok');
  });

  it('shows the intro step when 2FA is disabled', async () => {
    server.use(
      http.get('*/api/auth/2fa/status', () =>
        HttpResponse.json({ success: true, data: { twoFactorEnabled: false } })
      ),
      ...catchAll
    );

    render(<TwoFactorSetup />);

    expect(
      await screen.findByRole('button', { name: 'Enable 2FA' })
    ).toBeInTheDocument();
    expect(screen.getByText('Secure Your Account')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('advances to the QR/secret step after starting setup', async () => {
    server.use(
      http.get('*/api/auth/2fa/status', () =>
        HttpResponse.json({ success: true, data: { twoFactorEnabled: false } })
      ),
      http.post('*/api/auth/2fa/setup', () =>
        HttpResponse.json({
          success: true,
          data: {
            qrCode: 'data:image/png;base64,AAAA',
            secret: 'JBSWY3DPEHPK3PXP',
          },
        })
      ),
      ...catchAll
    );

    const user = userEvent.setup();
    render(<TwoFactorSetup />);

    await user.click(await screen.findByRole('button', { name: 'Enable 2FA' }));

    expect(await screen.findByText('Step 1: Scan QR Code')).toBeInTheDocument();
    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Verify & Enable' })
    ).toBeInTheDocument();
  });

  it('shows the active state when 2FA is already enabled', async () => {
    server.use(
      http.get('*/api/auth/2fa/status', () =>
        HttpResponse.json({ success: true, data: { twoFactorEnabled: true } })
      ),
      ...catchAll
    );

    render(<TwoFactorSetup />);

    expect(await screen.findByText('2FA is Active')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });
});
