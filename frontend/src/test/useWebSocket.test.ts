import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../hooks/useWebSocket';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState = 0;
  onopen: ((this: WebSocket, ev: Event) => void) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => void) | null = null;
  onerror: ((this: WebSocket, ev: Event) => void) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = 3;
    this.onclose?.call(this as unknown as WebSocket, {} as CloseEvent);
  });
  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.call(this as unknown as WebSocket, {} as Event);
    }, 0);
  }
}

describe('useWebSocket', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    (window as unknown as { WebSocket: typeof MockWebSocket }).WebSocket = MockWebSocket;
  });
  afterEach(() => { vi.useRealTimers(); });

  it('connects and reports open status', async () => {
    const { result } = renderHook(() => useWebSocket('ws://test'));
    await act(async () => { await new Promise(r => setTimeout(r, 5)); });
    expect(result.current.status).toBe('open');
  });

  it('parses incoming JSON messages', async () => {
    const { result } = renderHook(() => useWebSocket<{ x: number }>('ws://test'));
    await act(async () => { await new Promise(r => setTimeout(r, 5)); });
    const ws = MockWebSocket.instances[0];
    act(() => {
      ws.onmessage?.call(ws as unknown as WebSocket, { data: '{"x":42}' } as MessageEvent);
    });
    expect(result.current.data).toEqual({ x: 42 });
  });
});
