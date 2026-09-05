import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { MessageList } from './MessageList';

vi.mock('../hooks/useMessages', () => ({
  useMessages: () => ({
    error: null,
    loading: false,
    messages: [
      {
        fromUser: true,
        id: 'm1',
        text: 'Hola',
        timestamp: '2026-01-01T10:00:00.000Z',
      },
    ],
  }),
}));

describe('MessageList internal notes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders internal notes from localStorage', () => {
    localStorage.setItem(
      'internal-notes-c1',
      JSON.stringify([
        {
          author: 'Tú',
          id: 'n1',
          text: 'Contexto interno',
          timestamp: '2026-01-01T10:01:00.000Z',
        },
      ]),
    );

    render(<MessageList channel="web" conversationId="c1" />);

    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByText('Contexto interno')).toBeInTheDocument();
    expect(screen.getByText('Nota interna', { selector: 'span' })).toBeInTheDocument();
  });
});
