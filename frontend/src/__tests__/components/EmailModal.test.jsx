/**
 * Tests for EmailModal.
 *
 * Rendered open with an update object, it shows a header, a recipient input and
 * a Send button. We cover: the modal renders its fields; validation rejects an
 * invalid email address; and a valid send drives POST /email/daily/:id and
 * surfaces the success toast + calls onClose.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import EmailModal from '../../components/EmailModal';

const catchAll = [
  http.get('*', () => HttpResponse.json({ success: true, data: [] })),
  http.post('*', () => HttpResponse.json({ success: true, data: {} })),
  http.put('*', () => HttpResponse.json({ success: true, data: {} })),
  http.delete('*', () => HttpResponse.json({ success: true, data: {} })),
];

const update = {
  _id: 'u1',
  content: 'Did some work today',
  createdAt: new Date().toISOString(),
};

describe('EmailModal', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    server.use(...catchAll);
  });

  it('renders the header and recipient field when open', () => {
    render(
      <EmailModal isOpen onClose={() => {}} update={update} updateType="daily" />
    );

    expect(
      screen.getByText('📧 Send Daily Update via Email')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('email@example.com')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Email' })).toBeInTheDocument();
  });

  it('rejects an invalid email address with a validation toast', async () => {
    const user = userEvent.setup();
    render(
      <EmailModal isOpen onClose={() => {}} update={update} updateType="daily" />
    );

    await user.type(screen.getByPlaceholderText('email@example.com'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send Email' }));

    expect(await screen.findByText('Invalid email addresses')).toBeInTheDocument();
  });

  it('sends the email and closes on success', async () => {
    const onClose = vi.fn();
    server.use(
      http.post('*/api/email/daily/:id', () =>
        HttpResponse.json({ success: true, data: { sent: 1 } })
      ),
      ...catchAll
    );

    const user = userEvent.setup();
    render(
      <EmailModal isOpen onClose={onClose} update={update} updateType="daily" />
    );

    await user.type(
      screen.getByPlaceholderText('email@example.com'),
      'friend@example.com'
    );
    await user.click(screen.getByRole('button', { name: 'Send Email' }));

    expect(await screen.findByText('Email sent successfully')).toBeInTheDocument();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
