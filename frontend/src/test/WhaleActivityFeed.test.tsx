import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WhaleActivityFeed from '../components/WhaleActivityFeed';

vi.mock('../api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('WhaleActivityFeed', () => {
  it('shows no recent whale trades when list is empty', async () => {
    render(<WhaleActivityFeed />);
    expect(await screen.findByText(/No recent whale trades/i)).toBeInTheDocument();
  });
});
