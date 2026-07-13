/**
 * Behavioral tests for the Templates page.
 * Exercises list render, inline create form POST flow, delete DELETE flow,
 * and the save error branch.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../../test-utils/mocks/server';
import { render, screen } from '../../test-utils/test-utils';
import Templates from '../../pages/Templates';

const seedAuth = () => {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem(
    'user',
    JSON.stringify({ _id: 'u1', name: 'Test User', email: 'test@example.com' })
  );
};

describe('Templates page', () => {
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
  });

  it('renders heading and the template list from a mocked GET', async () => {
    server.use(
      http.get('*/templates', () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              _id: 'tp1',
              name: 'Sprint Update',
              description: 'Weekly sprint recap',
              content: 'Progress on [PROJECT]',
              type: 'daily',
              category: 'Sprint',
              usageCount: 2,
            },
          ],
        })
      )
    );

    render(<Templates />);

    expect(
      screen.getByRole('heading', { name: 'Update Templates' })
    ).toBeInTheDocument();
    expect(await screen.findByText('Sprint Update')).toBeInTheDocument();
    expect(screen.getByText('Weekly sprint recap')).toBeInTheDocument();
  });

  it('creates a template via the inline form and shows a success toast', async () => {
    const user = userEvent.setup();
    render(<Templates />);

    await screen.findByText(/No templates yet/);

    await user.click(screen.getByRole('button', { name: 'New Template' }));

    const nameInput = await screen.findByPlaceholderText(
      'e.g., Daily Standup, Sprint Update'
    );
    await user.type(nameInput, 'My Template');
    await user.type(
      screen.getByPlaceholderText('Template content with placeholders...'),
      'Some content here'
    );

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Template created!')).toBeInTheDocument();
  });

  it('deletes a template and shows a success toast', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/templates', () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              _id: 'tp1',
              name: 'Deletable',
              content: 'content',
              type: 'daily',
              usageCount: 0,
            },
          ],
        })
      )
    );

    render(<Templates />);
    await screen.findByText('Deletable');

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(await screen.findByText('Template deleted')).toBeInTheDocument();
  });

  it('refetches with a type filter when the Weekly filter is selected', async () => {
    const user = userEvent.setup();
    let weeklyRequested = false;
    server.use(
      http.get('*/templates', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('type') === 'weekly') weeklyRequested = true;
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    render(<Templates />);
    await screen.findByText(/No templates yet/);

    await user.click(screen.getByRole('button', { name: 'Weekly' }));

    await screen.findByText(/No templates yet/);
    expect(weeklyRequested).toBe(true);
  });

  it('shows an error toast when the save POST fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/templates', () =>
        HttpResponse.json({ success: false, message: 'Server error' }, { status: 500 })
      )
    );

    render(<Templates />);
    await screen.findByText(/No templates yet/);

    await user.click(screen.getByRole('button', { name: 'New Template' }));
    await user.type(
      await screen.findByPlaceholderText('e.g., Daily Standup, Sprint Update'),
      'Broken'
    );
    await user.type(
      screen.getByPlaceholderText('Template content with placeholders...'),
      'x'
    );
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Failed to save template')).toBeInTheDocument();
  });
});
