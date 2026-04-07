import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WhaleActivityFeed from '../components/WhaleActivityFeed';

describe('WhaleActivityFeed', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve([]),
    }));
  });

  it('shows no recent whale trades when list is empty', async () => {
    render(<WhaleActivityFeed />);
    expect(await screen.findByText(/No recent whale trades/i)).toBeInTheDocument();
  });
});
