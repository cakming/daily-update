/**
 * Behavioral tests for the Companies page.
 * Exercises the list render, create-modal POST flow, deactivate DELETE flow,
 * and the save error branch (catch block toast).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../../test-utils/mocks/server';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import Companies from '../../pages/Companies';

const seedAuth = () => {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem(
    'user',
    JSON.stringify({ _id: 'u1', name: 'Test User', email: 'test@example.com' })
  );
};

describe('Companies page', () => {
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

  it('renders heading and the company list from a mocked GET', async () => {
    server.use(
      http.get('*/companies', () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              _id: 'c1',
              name: 'Acme Corp',
              description: 'Main client',
              color: '#3182CE',
              isActive: true,
              updateCount: 4,
              createdAt: new Date().toISOString(),
            },
          ],
        })
      )
    );

    render(<Companies />);

    expect(
      screen.getByRole('heading', { name: 'Company Management' })
    ).toBeInTheDocument();
    expect(await screen.findByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Main client')).toBeInTheDocument();
  });

  it('creates a company through the modal and shows a success toast', async () => {
    const user = userEvent.setup();
    render(<Companies />);

    // wait for initial load to settle (empty state)
    expect(await screen.findByText('No companies found')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+ New Company' }));

    const nameInput = await screen.findByPlaceholderText('Acme Corp');
    await user.type(nameInput, 'New Company Inc');

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('Company created successfully')
    ).toBeInTheDocument();
  });

  it('deactivates an active company and shows a success toast', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/companies', () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              _id: 'c1',
              name: 'Acme Corp',
              color: '#3182CE',
              isActive: true,
              updateCount: 0,
              createdAt: new Date().toISOString(),
            },
          ],
        })
      )
    );

    render(<Companies />);
    await screen.findByText('Acme Corp');

    await user.click(screen.getByRole('button', { name: 'Deactivate' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(
      await screen.findByText('Company deactivated')
    ).toBeInTheDocument();
  });

  it('shows an error toast when the create POST fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/companies', () =>
        HttpResponse.json({ success: false, message: 'Server error' }, { status: 500 })
      )
    );

    render(<Companies />);
    await screen.findByText('No companies found');

    await user.click(screen.getByRole('button', { name: '+ New Company' }));
    const nameInput = await screen.findByPlaceholderText('Acme Corp');
    await user.type(nameInput, 'Broken Co');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('Failed to save company')
    ).toBeInTheDocument();
  });
});
