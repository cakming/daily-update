/**
 * Behavioral tests for the Notifications page.
 *
 * Covers: list render from GET /notifications, marking a notification as read
 * (PUT /notifications/:id/read), clearing read notifications via the confirm
 * dialog (DELETE /notifications/clear-read), and the mark-as-read error branch.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../../test-utils/mocks/server';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import Notifications from '../../pages/Notifications';

const API = 'http://localhost:5000/api';

const unread = {
  _id: 'n1',
  title: 'Welcome aboard',
  message: 'Thanks for joining',
  type: 'info',
  category: 'system',
  isRead: false,
  createdAt: new Date().toISOString(),
};

function seedAuth() {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem(
    'user',
    JSON.stringify({ _id: 'u1', name: 'Test User', email: 'test@example.com' })
  );
}

describe('Notifications page', () => {
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
      http.get('*', () => HttpResponse.json({ success: true, data: [], count: 0 })),
      http.post('*', () => HttpResponse.json({ success: true, data: {} })),
      http.put('*', () => HttpResponse.json({ success: true, data: {} })),
      http.delete('*', () => HttpResponse.json({ success: true }))
    );
  });

  it('renders the heading and a notification from the API', async () => {
    server.use(
      http.get(`${API}/notifications`, () =>
        HttpResponse.json({ success: true, data: [unread] })
      )
    );

    render(<Notifications />);

    expect(
      await screen.findByRole('heading', { name: /Notifications/ })
    ).toBeInTheDocument();
    expect(await screen.findByText('Welcome aboard')).toBeInTheDocument();
    expect(screen.getByText('Thanks for joining')).toBeInTheDocument();
  });

  it('marks a notification as read', async () => {
    let read = false;
    server.use(
      http.get(`${API}/notifications`, () =>
        HttpResponse.json({ success: true, data: [unread] })
      ),
      http.put(`${API}/notifications/${unread._id}/read`, () => {
        read = true;
        return HttpResponse.json({ success: true, data: {} });
      })
    );

    const user = userEvent.setup();
    render(<Notifications />);
    await screen.findByText('Welcome aboard');

    await user.click(screen.getByRole('button', { name: 'Mark as read' }));

    expect(
      await screen.findByText('Notification marked as read')
    ).toBeInTheDocument();
    await waitFor(() => expect(read).toBe(true));
  });

  it('clears read notifications via the confirm dialog', async () => {
    let cleared = false;
    server.use(
      http.get(`${API}/notifications`, () =>
        HttpResponse.json({
          success: true,
          data: [{ ...unread, _id: 'n2', isRead: true, title: 'Old news' }],
        })
      ),
      http.delete(`${API}/notifications/clear-read`, () => {
        cleared = true;
        return HttpResponse.json({ success: true });
      })
    );

    const user = userEvent.setup();
    render(<Notifications />);
    await screen.findByText('Old news');

    await user.click(screen.getByRole('button', { name: 'Clear read' }));
    await user.click(await screen.findByRole('button', { name: 'Clear Read' }));

    expect(
      await screen.findByText('All read notifications cleared')
    ).toBeInTheDocument();
    await waitFor(() => expect(cleared).toBe(true));
  });

  it('shows an error toast when mark-as-read fails', async () => {
    server.use(
      http.get(`${API}/notifications`, () =>
        HttpResponse.json({ success: true, data: [unread] })
      ),
      http.put(`${API}/notifications/${unread._id}/read`, () =>
        HttpResponse.json({ success: false, message: 'boom' }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    render(<Notifications />);
    await screen.findByText('Welcome aboard');

    await user.click(screen.getByRole('button', { name: 'Mark as read' }));

    expect(
      await screen.findByText('Failed to mark notification as read')
    ).toBeInTheDocument();
  });
});
