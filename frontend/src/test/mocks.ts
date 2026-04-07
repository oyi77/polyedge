import { vi } from 'vitest'

// Mock the entire api module
vi.mock('../api', () => ({
  getAdminApiKey: vi.fn(() => ''),
  setAdminApiKey: vi.fn(),
  fetchDecisions: vi.fn(() => Promise.resolve({ items: [], total: 0 })),
  decisionsExportUrl: vi.fn((params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return `/api/decisions/export${qs}`
  }),
}))

// Mock axios
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }
  return { default: mockAxios }
})
