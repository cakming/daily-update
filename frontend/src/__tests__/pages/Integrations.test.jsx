/**
 * Behavioral tests for the Integrations page.
 *
 * The page fetches GET /integrations/telegram/status and
 * /integrations/googlechat/status on mount (via Promise.all) and derives its
 * connect/disconnect UI from them, so both are mocked with {linked:false}.
 *
 * Covers: render + disconnected badges, linking Telegram (POST
 * /integrations/telegram/link), linking Google Chat from its tab (POST
 * /integrations/googlechat/link), and the Google Chat link error branch.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../../test-utils/mocks/server';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import Integrations from '../../pages/Integrations';

const API = 'http://localhost:5000/api';

function statusHandlers(telegram = { linked: false }, googlechat = { linked: false }) {
  return [
    http.get(`${API}/integrations/telegram/status`, () =>
      HttpResponse.json({ success: true, data: telegram })
    ),
    http.get(`${API}/integrations/googlechat/status`, () =>
      HttpResponse.json({ success: true, data: googlechat })
    ),
  ];
}

function seedAuth() {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem(
    'user',
    JSON.stringify({ _id: 'u1', name: 'Test User', email: 'test@example.com' })
  );
}

describe('Integrations page', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    seedAuth();
    server.use(
      http.get('*/auth/me', () =>
        HttpResponse.json({
          success: true,
          data: { _id: 'u1', name: 'Test User', email: 'test@example.com' },
        })
      ),
      ...statusHandlers(),
      http.get('*', () => HttpResponse.json({ success: true, data: [], count: 0 })),
      http.post('*', () => HttpResponse.json({ success: true, data: {} })),
      http.put('*', () => HttpResponse.json({ success: true, data: {} })),
      http.delete('*', () => HttpResponse.json({ success: true }))
    );
  });

  it('renders the heading and disconnected status', async () => {
    render(<Integrations />);

    expect(
      await screen.findByRole('heading', { name: /Integrations/ })
    ).toBeInTheDocument();
    expect(await screen.findByText('Telegram Bot')).toBeInTheDocument();
    expect(screen.getAllByText('Not Connected').length).toBeGreaterThan(0);
  });

  it('links a Telegram account', async () => {
    let posted = null;
    server.use(
      http.post(`${API}/integrations/telegram/link`, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json({ success: true, data: {} });
      })
    );

    const user = userEvent.setup();
    render(<Integrations />);

    await user.type(
      await screen.findByPlaceholderText('Enter your Telegram ID'),
      '123456789'
    );
    const connects = screen.getAllByRole('button', { name: 'Connect' });
    await user.click(connects[0]);

    expect(
      await screen.findByText('Telegram linked successfully')
    ).toBeInTheDocument();
    await waitFor(() => expect(posted).toEqual({ telegramId: '123456789' }));
  });

  it('links a Google Chat webhook from its tab', async () => {
    let posted = null;
    server.use(
      http.post(`${API}/integrations/googlechat/link`, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json({ success: true, data: {} });
      })
    );

    const user = userEvent.setup();
    render(<Integrations />);

    await user.click(await screen.findByRole('tab', { name: /Google Chat/ }));

    const webhook = 'https://chat.googleapis.com/v1/spaces/AAA/messages';
    await user.type(
      await screen.findByPlaceholderText('https://chat.googleapis.com/v1/spaces/...'),
      webhook
    );
    const connects = screen.getAllByRole('button', { name: 'Connect' });
    await user.click(connects[connects.length - 1]);

    expect(
      await screen.findByText('Google Chat linked successfully')
    ).toBeInTheDocument();
    await waitFor(() => expect(posted).toEqual({ webhookUrl: webhook }));
  });

  it('shows an error toast when Google Chat linking fails', async () => {
    server.use(
      http.post(`${API}/integrations/googlechat/link`, () =>
        HttpResponse.json({ success: false, message: 'bad webhook' }, { status: 400 })
      )
    );

    const user = userEvent.setup();
    render(<Integrations />);

    await user.click(await screen.findByRole('tab', { name: /Google Chat/ }));
    await user.type(
      await screen.findByPlaceholderText('https://chat.googleapis.com/v1/spaces/...'),
      'https://bad'
    );
    const connects = screen.getAllByRole('button', { name: 'Connect' });
    await user.click(connects[connects.length - 1]);

    expect(
      await screen.findByText('Failed to link Google Chat')
    ).toBeInTheDocument();
  });
});
