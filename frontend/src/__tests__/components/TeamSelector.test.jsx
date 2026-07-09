/**
 * Tests for TeamSelector.
 *
 * On mount it fetches GET /teams and populates a native <select>. We assert the
 * team options render (native <option> nodes are in the DOM regardless of the
 * select being "open"), the empty-state message appears when there are no
 * teams, and the visibility toggle section shows when a team is preselected.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import TeamSelector from '../../components/TeamSelector';

const catchAll = [
  http.get('*', () => HttpResponse.json({ success: true, data: [] })),
  http.post('*', () => HttpResponse.json({ success: true, data: {} })),
  http.put('*', () => HttpResponse.json({ success: true, data: {} })),
  http.delete('*', () => HttpResponse.json({ success: true, data: {} })),
];

describe('TeamSelector', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
  });

  it('renders team options fetched from the API', async () => {
    server.use(
      http.get('*/api/teams', () =>
        HttpResponse.json({
          success: true,
          data: [
            { _id: 't1', name: 'Team Alpha', members: [{}, {}, {}] },
            { _id: 't2', name: 'Team Beta', members: [] },
          ],
        })
      ),
      ...catchAll
    );

    render(
      <TeamSelector
        selectedTeamId=""
        onTeamChange={() => {}}
        visibility="private"
        onVisibilityChange={() => {}}
      />
    );

    expect(screen.getByText('Share with Team (Optional)')).toBeInTheDocument();
    expect(await screen.findByText('Team Alpha (3 members)')).toBeInTheDocument();
    expect(screen.getByText('Team Beta (0 members)')).toBeInTheDocument();
  });

  it('shows the empty state when the user has no teams', async () => {
    server.use(
      http.get('*/api/teams', () =>
        HttpResponse.json({ success: true, data: [] })
      ),
      ...catchAll
    );

    render(
      <TeamSelector
        selectedTeamId=""
        onTeamChange={() => {}}
        visibility="private"
        onVisibilityChange={() => {}}
      />
    );

    expect(
      await screen.findByText(/You haven't joined any teams yet/i)
    ).toBeInTheDocument();
  });

  it('shows the visibility toggle when a team is selected', async () => {
    server.use(
      http.get('*/api/teams', () =>
        HttpResponse.json({
          success: true,
          data: [{ _id: 't1', name: 'Team Alpha', members: [] }],
        })
      ),
      ...catchAll
    );

    render(
      <TeamSelector
        selectedTeamId="t1"
        onTeamChange={() => {}}
        visibility="team"
        onVisibilityChange={() => {}}
      />
    );

    expect(await screen.findByText('Visibility')).toBeInTheDocument();
    expect(
      screen.getByText('Team members can see this update')
    ).toBeInTheDocument();
  });
});
