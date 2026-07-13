/**
 * Tests for NotificationBell.
 *
 * On mount it fetches GET /notifications/unread-count and shows the count as a
 * badge on the bell button. Opening the popover (clicking the bell) triggers
 * GET /notifications and renders the notification list. We cover the unread
 * badge and the opened list; both drive real mocked requests.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import NotificationBell from '../../components/NotificationBell';

const catchAll = [
  http.get('*', () => HttpResponse.json({ success: true, data: [] })),
  http.post('*', () => HttpResponse.json({ success: true, data: {} })),
  http.put('*', () => HttpResponse.json({ success: true, data: {} })),
  http.delete('*', () => HttpResponse.json({ success: true, data: {} })),
];

describe('NotificationBell', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
  });

  it('renders the unread count badge from the API', async () => {
    server.use(
      http.get('*/api/notifications/unread-count', () =>
        HttpResponse.json({ success: true, data: { count: 4 } })
      ),
      ...catchAll
    );

    render(<NotificationBell />);

    expect(
      screen.getByRole('button', { name: 'Notifications' })
    ).toBeInTheDocument();
    expect(await screen.findByText('4')).toBeInTheDocument();
  });

  it('loads and displays notifications when the bell is opened', async () => {
    server.use(
      http.get('*/api/notifications/unread-count', () =>
        HttpResponse.json({ success: true, data: { count: 1 } })
      ),
      http.get('*/api/notifications', () =>
        HttpResponse.json({
          success: true,
          unreadCount: 1,
          data: [
            {
              _id: 'n1',
              title: 'Welcome aboard',
              message: 'Thanks for joining',
              type: 'success',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          ],
        })
      ),
      ...catchAll
    );

    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(await screen.findByText('Welcome aboard')).toBeInTheDocument();
    expect(screen.getByText('Thanks for joining')).toBeInTheDocument();
  });
});
