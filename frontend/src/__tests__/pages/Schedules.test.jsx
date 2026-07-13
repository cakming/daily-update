/**
 * Behavioral tests for the Schedules page.
 *
 * Covers: rendering a schedule from GET /schedules, toggling a schedule's
 * active state (POST /schedules/:id/toggle via the card Switch), creating a
 * schedule through the modal (POST /schedules), and the create error branch.
 *
 * Chakra's Switch renders an sr-only checkbox that userEvent considers not
 * visible, so we drive toggles with fireEvent.click on the checkbox role.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../../test-utils/mocks/server';
import { render, screen, waitFor, fireEvent } from '../../test-utils/test-utils';
import Schedules from '../../pages/Schedules';

const API = 'http://localhost:5000/api';

const SCHEDULE = {
  _id: 's1',
  type: 'daily',
  scheduleType: 'daily',
  isActive: true,
  content: 'Standup notes template',
  scheduledTime: '09:00',
  recipients: [],
  sendEmail: false,
};

function seedAuth() {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem(
    'user',
    JSON.stringify({ _id: 'u1', name: 'Test User', email: 'test@example.com' })
  );
}

describe('Schedules page', () => {
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

  it('renders the heading and a schedule from the API', async () => {
    server.use(
      http.get(`${API}/schedules`, () =>
        HttpResponse.json({ success: true, data: [SCHEDULE], count: 1 })
      )
    );

    render(<Schedules />);

    expect(
      await screen.findByRole('heading', { name: /Scheduled Updates/ })
    ).toBeInTheDocument();
    expect(await screen.findByText('Standup notes template')).toBeInTheDocument();
  });

  it('toggles a schedule active state', async () => {
    let toggled = false;
    server.use(
      http.get(`${API}/schedules`, () =>
        HttpResponse.json({ success: true, data: [SCHEDULE], count: 1 })
      ),
      http.post(`${API}/schedules/${SCHEDULE._id}/toggle`, () => {
        toggled = true;
        return HttpResponse.json({ success: true, data: {} });
      })
    );

    render(<Schedules />);
    await screen.findByText('Standup notes template');

    fireEvent.click(screen.getByRole('checkbox'));

    expect(await screen.findByText('Schedule toggled')).toBeInTheDocument();
    await waitFor(() => expect(toggled).toBe(true));
  });

  it('creates a schedule via the modal', async () => {
    const user = userEvent.setup();
    let posted = null;
    server.use(
      http.get(`${API}/schedules`, () =>
        HttpResponse.json({ success: true, data: [], count: 0 })
      ),
      http.post(`${API}/schedules`, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json({ success: true, data: { _id: 's2' } }, { status: 201 });
      })
    );

    render(<Schedules />);
    await screen.findByRole('button', { name: 'Create Schedule' });

    await user.click(screen.getByRole('button', { name: 'Create Schedule' }));
    await user.type(
      await screen.findByPlaceholderText('Enter the content for the scheduled update...'),
      'New scheduled content'
    );

    const createButtons = screen.getAllByRole('button', { name: /Create Schedule/ });
    await user.click(createButtons[createButtons.length - 1]);

    expect(await screen.findByText('Schedule created')).toBeInTheDocument();
    await waitFor(() => expect(posted?.content).toBe('New scheduled content'));
  });

  it('shows an error toast when schedule creation fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${API}/schedules`, () =>
        HttpResponse.json({ success: true, data: [], count: 0 })
      ),
      http.post(`${API}/schedules`, () =>
        HttpResponse.json({ success: false, message: 'nope' }, { status: 500 })
      )
    );

    render(<Schedules />);
    await screen.findByRole('button', { name: 'Create Schedule' });

    await user.click(screen.getByRole('button', { name: 'Create Schedule' }));
    await user.type(
      await screen.findByPlaceholderText('Enter the content for the scheduled update...'),
      'Will fail'
    );

    const createButtons = screen.getAllByRole('button', { name: /Create Schedule/ });
    await user.click(createButtons[createButtons.length - 1]);

    expect(
      await screen.findByText('Failed to create schedule')
    ).toBeInTheDocument();
  });
});
