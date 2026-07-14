/**
 * Behavioral tests for the NotificationPreferences page.
 *
 * The page loads a fully-shaped preferences object from
 * GET /notification-preferences (it dereferences nested groups on render, so
 * the mock must return the real shape) and persists via PUT.
 *
 * Covers: render, toggling a switch + saving (PUT /notification-preferences),
 * and the save error branch. Chakra Switches are sr-only checkboxes, so we
 * toggle with fireEvent.click.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../../test-utils/mocks/server';
import { render, screen, waitFor, fireEvent } from '../../test-utils/test-utils';
import NotificationPreferences from '../../pages/NotificationPreferences';

const API = 'http://localhost:5000/api';

const PREFS = {
  emailNotifications: {
    enabled: true,
    dailyDigest: false,
    weeklyDigest: true,
    systemAlerts: true,
    updateReminders: true,
  },
  inAppNotifications: {
    enabled: true,
    systemNotifications: true,
    updateNotifications: true,
    reminderNotifications: true,
    achievementNotifications: true,
  },
  botNotifications: {
    telegram: true,
    googleChat: true,
    sendOnCreate: false,
    sendDailySummary: false,
    sendWeeklySummary: true,
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'UTC',
  },
};

function seedAuth() {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem(
    'user',
    JSON.stringify({ _id: 'u1', name: 'Test User', email: 'test@example.com' })
  );
}

describe('NotificationPreferences page', () => {
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
      http.get(`${API}/notification-preferences`, () =>
        HttpResponse.json({ success: true, data: PREFS })
      ),
      http.get('*', () => HttpResponse.json({ success: true, data: [], count: 0 })),
      http.post('*', () => HttpResponse.json({ success: true, data: {} })),
      http.put('*', () => HttpResponse.json({ success: true, data: {} })),
      http.delete('*', () => HttpResponse.json({ success: true }))
    );
  });

  it('renders the preferences sections from the API', async () => {
    render(<NotificationPreferences />);

    expect(
      await screen.findByRole('heading', { name: /Notification Preferences/ })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /Email Notifications/ })
    ).toBeInTheDocument();
  });

  it('toggles a preference and saves', async () => {
    let putBody = null;
    server.use(
      http.put(`${API}/notification-preferences`, async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json({ success: true, data: putBody });
      })
    );

    const user = userEvent.setup();
    render(<NotificationPreferences />);
    await screen.findByRole('heading', { name: /Email Notifications/ });

    // Toggle the first switch (top-level Email Notifications enabled).
    fireEvent.click(screen.getAllByRole('checkbox')[0]);

    await user.click(screen.getByRole('button', { name: 'Save Preferences' }));

    expect(await screen.findByText('Preferences saved')).toBeInTheDocument();
    await waitFor(() =>
      expect(putBody?.emailNotifications?.enabled).toBe(false)
    );
  });

  it('changes the summary mode and saves it', async () => {
    let putBody = null;
    server.use(
      http.put(`${API}/notification-preferences`, async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json({ success: true, data: putBody });
      })
    );

    const user = userEvent.setup();
    render(<NotificationPreferences />);
    await screen.findByRole('heading', { name: /Notification Content/ });

    await user.selectOptions(
      screen.getByLabelText('Notification content mode'),
      'summary'
    );
    await user.click(screen.getByRole('button', { name: 'Save Preferences' }));

    expect(await screen.findByText('Preferences saved')).toBeInTheDocument();
    await waitFor(() => expect(putBody?.summaryMode).toBe('summary'));
  });

  it('shows an error toast when saving fails', async () => {
    server.use(
      http.put(`${API}/notification-preferences`, () =>
        HttpResponse.json({ success: false, message: 'boom' }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    render(<NotificationPreferences />);
    await screen.findByRole('heading', { name: /Email Notifications/ });

    await user.click(screen.getByRole('button', { name: 'Save Preferences' }));

    expect(
      await screen.findByText('Failed to save preferences')
    ).toBeInTheDocument();
  });
});
