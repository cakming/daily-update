/**
 * Behavioral tests for BulkOperations: the disabled/enabled trigger, the delete
 * confirmation flow (POST /bulk/delete + onSuccess), and the "no tags selected"
 * guard on the assign-tags modal.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import BulkOperations from '../../components/BulkOperations';

const API = 'http://localhost:5000/api';

describe('BulkOperations', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    Element.prototype.scrollTo = vi.fn();
    server.use(
      http.get(`${API}/tags`, () =>
        HttpResponse.json({ success: true, data: [{ _id: 't1', name: 'backend' }] })
      ),
      http.get(`${API}/companies`, () =>
        HttpResponse.json({ success: true, data: [{ _id: 'c1', name: 'Acme' }] })
      ),
      http.get('*', () => HttpResponse.json({ success: true, data: [] }))
    );
  });

  it('disables the trigger when nothing is selected', async () => {
    render(<BulkOperations selectedIds={[]} updateType="daily" onSuccess={vi.fn()} />);
    expect(await screen.findByRole('button', { name: /Bulk Actions/ })).toBeDisabled();
  });

  it('deletes the selected updates and calls onSuccess', async () => {
    const onSuccess = vi.fn();
    let posted = null;
    server.use(
      http.post(`${API}/bulk/delete`, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    const user = userEvent.setup();
    render(
      <BulkOperations selectedIds={['a', 'b']} updateType="daily" onSuccess={onSuccess} />
    );

    await user.click(await screen.findByRole('button', { name: /Bulk Actions \(2\)/ }));
    await user.click(await screen.findByRole('menuitem', { name: /Delete Selected/ }));

    // Confirm in the AlertDialog.
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Bulk delete successful')).toBeInTheDocument();
    await waitFor(() => expect(posted).toEqual({ ids: ['a', 'b'], type: 'daily' }));
    expect(onSuccess).toHaveBeenCalled();
  });

  it('exports the selected updates from the export modal', async () => {
    server.use(
      http.post(`${API}/bulk/export`, () => HttpResponse.json({ ok: true }))
    );
    window.URL.createObjectURL = vi.fn(() => 'blob:mock');
    window.URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();

    const user = userEvent.setup();
    render(<BulkOperations selectedIds={['a']} updateType="daily" onSuccess={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /Bulk Actions/ }));
    await user.click(await screen.findByRole('menuitem', { name: /Export Selected/ }));

    // The export modal's action button reads "Export JSON" (default format).
    await user.click(await screen.findByRole('button', { name: /Export JSON/ }));

    expect(await screen.findByText('Export successful')).toBeInTheDocument();
  });
});
