import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OpportunityScanner from '../components/OpportunityScanner';

describe('OpportunityScanner', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ opportunities: [] }),
    }));
  });

  it('shows no opportunities message when list is empty', async () => {
    render(<OpportunityScanner />);
    expect(await screen.findByText(/No arbitrage opportunities/i)).toBeInTheDocument();
  });
});
