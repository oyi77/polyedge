import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock axios before importing api
vi.mock('axios', () => {
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }
  return {
    default: {
      create: vi.fn(() => instance),
    },
  }
})

import { getAdminApiKey, setAdminApiKey, decisionsExportUrl } from '../api'

describe('api utility functions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getAdminApiKey', () => {
    it('returns empty string when not set', () => {
      expect(getAdminApiKey()).toBe('')
    })

    it('returns the stored key when set', () => {
      localStorage.setItem('adminApiKey', 'my-secret-key')
      expect(getAdminApiKey()).toBe('my-secret-key')
    })
  })

  describe('setAdminApiKey', () => {
    it('stores key in localStorage', () => {
      setAdminApiKey('abc123')
      expect(localStorage.getItem('adminApiKey')).toBe('abc123')
    })

    it('removes key from localStorage when empty string passed', () => {
      localStorage.setItem('adminApiKey', 'existing-key')
      setAdminApiKey('')
      expect(localStorage.getItem('adminApiKey')).toBeNull()
    })

    it('overwrites existing key with new value', () => {
      setAdminApiKey('first-key')
      setAdminApiKey('second-key')
      expect(localStorage.getItem('adminApiKey')).toBe('second-key')
    })
  })

  describe('decisionsExportUrl', () => {
    it('returns base URL with no params', () => {
      const url = decisionsExportUrl()
      expect(url).toBe('/api/decisions/export')
    })

    it('returns URL with query params', () => {
      const url = decisionsExportUrl({ strategy: 'momentum', decision: 'BUY' })
      expect(url).toContain('/api/decisions/export?')
      expect(url).toContain('strategy=momentum')
      expect(url).toContain('decision=BUY')
    })

    it('returns URL with single query param', () => {
      const url = decisionsExportUrl({ format: 'csv' })
      expect(url).toBe('/api/decisions/export?format=csv')
    })
  })
})
