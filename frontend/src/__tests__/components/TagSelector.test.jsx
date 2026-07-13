/**
 * Tests for TagSelector.
 *
 * On mount it fetches GET /tags. The always-visible selected-tags box shows
 * "No tags selected" when empty, and resolves preselected IDs into removable
 * badges once the tag list loads. We assert the label, the empty state, and a
 * resolved selected tag name.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import TagSelector from '../../components/TagSelector';

const tags = [
  { _id: 'tag1', name: 'Backend', category: 'project', color: '#3182CE' },
  { _id: 'tag2', name: 'Frontend', category: 'project', color: '#38A169' },
];

const catchAll = [
  http.get('*', () => HttpResponse.json({ success: true, data: [] })),
  http.post('*', () => HttpResponse.json({ success: true, data: {} })),
  http.put('*', () => HttpResponse.json({ success: true, data: {} })),
  http.delete('*', () => HttpResponse.json({ success: true, data: {} })),
];

describe('TagSelector', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    server.use(
      http.get('*/api/tags', () =>
        HttpResponse.json({ success: true, data: tags })
      ),
      ...catchAll
    );
  });

  it('renders the label, trigger and empty state when nothing is selected', () => {
    render(<TagSelector selectedTags={[]} onChange={() => {}} />);

    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select Tags' })).toBeInTheDocument();
    expect(screen.getByText('No tags selected')).toBeInTheDocument();
  });

  it('resolves preselected tag IDs into badges from the fetched list', async () => {
    render(<TagSelector selectedTags={['tag2']} onChange={() => {}} />);

    expect(await screen.findByText('Frontend')).toBeInTheDocument();
    expect(screen.queryByText('No tags selected')).not.toBeInTheDocument();
  });
});
