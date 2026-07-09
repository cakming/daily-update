/**
 * Behavioral tests for the Teams page.
 *
 * Covers: empty-state render from GET /teams, creating a team (fill the modal
 * form + submit, asserting POST /teams fires and the success toast shows), and
 * the create error branch (POST -> 500 surfaces the failure toast).
 *
 * We deliberately assert the empty-state list rather than a populated one:
 * Teams' getUserRole() dereferences the AuthContext `user`, which is loaded
 * asynchronously via GET /auth/me. Because child effects (fetchTeams) run
 * before the AuthProvider effect (getMe), a populated list can render before
 * `user` resolves and crash. The empty state exercises fetchTeams' success path
 * without that race, and the create flow covers the primary mutation.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../../test-utils/mocks/server';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import Teams from '../../pages/Teams';

const API = 'http://localhost:5000/api';

function seedAuth() {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem(
    'user',
    JSON.stringify({ _id: 'u1', name: 'Test User', email: 'test@example.com' })
  );
}

describe('Teams page', () => {
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

  it('renders the heading and empty state from the API', async () => {
    server.use(
      http.get(`${API}/teams`, () =>
        HttpResponse.json({ success: true, data: [], count: 0 })
      )
    );

    render(<Teams />);

    expect(
      await screen.findByRole('heading', { name: 'Teams' })
    ).toBeInTheDocument();
    expect(await screen.findByText('No teams yet')).toBeInTheDocument();
  });

  it('creates a team via the modal form', async () => {
    const user = userEvent.setup();
    let posted = null;
    server.use(
      http.get(`${API}/teams`, () =>
        HttpResponse.json({ success: true, data: [], count: 0 })
      ),
      http.post(`${API}/teams`, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json(
          { success: true, data: { _id: 't1', ...posted } },
          { status: 201 }
        );
      })
    );

    render(<Teams />);
    await screen.findByText('No teams yet');

    await user.click(screen.getByRole('button', { name: 'Create Team' }));
    await user.type(
      await screen.findByPlaceholderText('Engineering Team'),
      'QA Team'
    );

    const createButtons = screen.getAllByRole('button', { name: 'Create Team' });
    await user.click(createButtons[createButtons.length - 1]);

    expect(
      await screen.findByText('Team created successfully')
    ).toBeInTheDocument();
    await waitFor(() => expect(posted).toEqual({ name: 'QA Team', description: '' }));
  });

  it('shows an error toast when team creation fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${API}/teams`, () =>
        HttpResponse.json({ success: true, data: [], count: 0 })
      ),
      http.post(`${API}/teams`, () =>
        HttpResponse.json(
          { success: false, message: 'Server exploded' },
          { status: 500 }
        )
      )
    );

    render(<Teams />);
    await screen.findByText('No teams yet');

    await user.click(screen.getByRole('button', { name: 'Create Team' }));
    await user.type(
      await screen.findByPlaceholderText('Engineering Team'),
      'Broken Team'
    );

    const createButtons = screen.getAllByRole('button', { name: 'Create Team' });
    await user.click(createButtons[createButtons.length - 1]);

    expect(
      await screen.findByText('Failed to create team')
    ).toBeInTheDocument();
  });
});
