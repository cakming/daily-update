/**
 * Tests for TagFilter.
 *
 * On mount it fetches GET /tags. The filter trigger button always renders, and
 * any preselected tags are shown as removable badges outside the popover (the
 * component resolves selected IDs against the fetched tag list). We assert the
 * trigger, the selected-count badge, and the resolved selected tag name — all
 * of which depend on the mocked GET resolving.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import TagFilter from '../../components/TagFilter';

const tags = [
  { _id: 'tag1', name: 'Backend', category: 'project', color: '#3182CE' },
  { _id: 'tag2', name: 'Urgent', category: 'priority', color: '#E53E3E' },
];

const catchAll = [
  http.get('*', () => HttpResponse.json({ success: true, data: [] })),
  http.post('*', () => HttpResponse.json({ success: true, data: {} })),
  http.put('*', () => HttpResponse.json({ success: true, data: {} })),
  http.delete('*', () => HttpResponse.json({ success: true, data: {} })),
];

describe('TagFilter', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    server.use(
      http.get('*/api/tags', () =>
        HttpResponse.json({ success: true, data: tags })
      ),
      ...catchAll
    );
  });

  it('renders the filter trigger button', () => {
    render(<TagFilter selectedTags={[]} onChange={() => {}} />);
    expect(
      screen.getByRole('button', { name: /Filter by Tags/i })
    ).toBeInTheDocument();
  });

  it('shows selected tags resolved from the fetched tag list', async () => {
    render(<TagFilter selectedTags={['tag1']} onChange={() => {}} />);

    // The selected count badge and the resolved tag name render outside the
    // popover once the tag list has loaded.
    expect(await screen.findByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
