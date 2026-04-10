import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OpportunityScanner from '../components/OpportunityScanner';

vi.mock('../api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: { opportunities: [] } }),
  },
}));

describe('OpportunityScanner', () => {
  it('shows no opportunities message when list is empty', async () => {
    render(<OpportunityScanner />);
    expect(await screen.findByText(/No arbitrage opportunities/i)).toBeInTheDocument();
  });
});
