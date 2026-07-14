/**
 * Behavioral test for the ExportButton component.
 *
 * Covers: it renders its trigger button and, when clicked, opens the menu
 * exposing the four export format options. ExportButton performs no on-mount
 * fetch, so no MSW handlers are required.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import { render, screen } from '../../test-utils/test-utils';
import ExportButton from '../../components/ExportButton';

const API = 'http://localhost:5000/api';

describe('ExportButton', () => {
  beforeEach(() => {
    // MSW's XHR interceptor resolves request URLs against window.location.
    window.location.href = 'http://localhost:3000/';
    // jsdom lacks URL object-URL + anchor download + scrollTo plumbing.
    window.URL.createObjectURL = vi.fn(() => 'blob:mock');
    window.URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
    Element.prototype.scrollTo = vi.fn();
  });

  it('renders the trigger and opens the export menu', async () => {
    const user = userEvent.setup();
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /Export/ });
    await user.click(trigger);

    expect(await screen.findByRole('menuitem', { name: /Export as CSV/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Export as JSON/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Export as Markdown/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Export as PDF/ })).toBeInTheDocument();
  });

  it('downloads and toasts on a successful CSV export', async () => {
    server.use(
      http.get(`${API}/export/csv`, () => HttpResponse.text('a,b\n1,2'))
    );
    const user = userEvent.setup();
    render(<ExportButton filters={{ companyId: 'c1' }} />);

    await user.click(screen.getByRole('button', { name: /Export/ }));
    await user.click(await screen.findByRole('menuitem', { name: /Export as CSV/ }));

    expect(await screen.findByText('Export successful!')).toBeInTheDocument();
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });

  it('shows an error toast when the export request fails', async () => {
    server.use(
      http.get(`${API}/export/json`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 })
      )
    );
    const user = userEvent.setup();
    render(<ExportButton />);

    await user.click(screen.getByRole('button', { name: /Export/ }));
    await user.click(await screen.findByRole('menuitem', { name: /Export as JSON/ }));

    expect(await screen.findByText('Export failed')).toBeInTheDocument();
  });
});
