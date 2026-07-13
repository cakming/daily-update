/**
 * Behavioral tests for the Tags page.
 * Exercises list render, create-modal POST flow, deactivate DELETE flow,
 * and the create error branch.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../../test-utils/mocks/server';
import { render, screen } from '../../test-utils/test-utils';
import Tags from '../../pages/Tags';

const seedAuth = () => {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem(
    'user',
    JSON.stringify({ _id: 'u1', name: 'Test User', email: 'test@example.com' })
  );
};

describe('Tags page', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    seedAuth();
    window.confirm = vi.fn(() => true);
    server.use(
      http.get('*', () => HttpResponse.json({ success: true, data: [], count: 0 })),
      http.post('*', () => HttpResponse.json({ success: true, data: {} })),
      http.put('*', () => HttpResponse.json({ success: true, data: {} })),
      http.delete('*', () => HttpResponse.json({ success: true })),
      http.get('*/auth/me', () =>
        HttpResponse.json({
          success: true,
          data: { _id: 'u1', name: 'Test User', email: 'test@example.com' },
        })
      )
    );
    // Separate server.use so this handler is prepended AFTER the catch-all '*'
    // above and therefore wins for the stats endpoint. The stats section
    // dereferences tagStats.tagsByCategory.project, so returning [] (the
    // catch-all's data) would crash the render; null makes it skip the section.
    server.use(
      http.get('*/tags/stats', () =>
        HttpResponse.json({ success: true, data: null })
      )
    );
  });

  it('renders heading and the tag list from a mocked GET', async () => {
    server.use(
      http.get('*/tags', () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              _id: 't1',
              name: 'Frontend',
              color: '#3182CE',
              category: 'project',
              usageCount: 7,
            },
          ],
        })
      )
    );

    render(<Tags />);

    expect(
      screen.getByRole('heading', { name: 'Tags & Categories' })
    ).toBeInTheDocument();
    expect(await screen.findByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Used 7 times')).toBeInTheDocument();
  });

  it('creates a tag through the modal and shows a success toast', async () => {
    const user = userEvent.setup();
    render(<Tags />);

    await screen.findByText(/No tags found/);

    await user.click(screen.getByRole('button', { name: 'Create New Tag' }));

    const nameInput = await screen.findByPlaceholderText('Enter tag name');
    await user.type(nameInput, 'Backend');

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('Tag created successfully')
    ).toBeInTheDocument();
  });

  it('deactivates a tag and shows a success toast', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/tags', () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              _id: 't1',
              name: 'Frontend',
              color: '#3182CE',
              category: 'custom',
              usageCount: 1,
            },
          ],
        })
      )
    );

    render(<Tags />);
    await screen.findByText('Frontend');

    await user.click(screen.getByRole('button', { name: 'Deactivate' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(await screen.findByText('Tag deactivated')).toBeInTheDocument();
  });

  it('shows an error toast when tag creation fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/tags', () =>
        HttpResponse.json({ success: false, message: 'Bad request' }, { status: 400 })
      )
    );

    render(<Tags />);
    await screen.findByText(/No tags found/);

    await user.click(screen.getByRole('button', { name: 'Create New Tag' }));
    const nameInput = await screen.findByPlaceholderText('Enter tag name');
    await user.type(nameInput, 'Broken');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('Failed to create tag')
    ).toBeInTheDocument();
  });
});
