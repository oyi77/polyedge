import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTableQuery } from '../hooks/useTableQuery'

describe('useTableQuery', () => {
  it('initializes with correct defaults', () => {
    const { result } = renderHook(() => useTableQuery())
    expect(result.current.state.sort).toBe('created_at')
    expect(result.current.state.order).toBe('desc')
    expect(result.current.state.limit).toBe(50)
    expect(result.current.state.offset).toBe(0)
    expect(result.current.state.filters).toEqual({})
    expect(result.current.currentPage).toBe(0)
  })

  it('accepts custom default options', () => {
    const { result } = renderHook(() =>
      useTableQuery({ defaultSort: 'name', defaultOrder: 'asc', defaultLimit: 25 })
    )
    expect(result.current.state.sort).toBe('name')
    expect(result.current.state.order).toBe('asc')
    expect(result.current.state.limit).toBe(25)
  })

  it('setSort updates sort and resets offset', () => {
    const { result } = renderHook(() => useTableQuery())
    act(() => {
      result.current.setSort('market_ticker')
    })
    expect(result.current.state.sort).toBe('market_ticker')
    expect(result.current.state.offset).toBe(0)
  })

  it('setSort toggles order when same column clicked', () => {
    const { result } = renderHook(() => useTableQuery({ defaultSort: 'name', defaultOrder: 'asc' }))
    act(() => {
      result.current.setSort('name')
    })
    expect(result.current.state.order).toBe('desc')
  })

  it('setFilter updates filters and resets offset', () => {
    const { result } = renderHook(() =>
      useTableQuery({ defaultLimit: 50 })
    )
    // First go to page 1
    act(() => {
      result.current.setPage(1)
    })
    expect(result.current.state.offset).toBe(50)
    // Now set a filter — offset should reset
    act(() => {
      result.current.setFilter('strategy', 'momentum')
    })
    expect(result.current.state.filters.strategy).toBe('momentum')
    expect(result.current.state.offset).toBe(0)
  })

  it('setPage updates offset correctly', () => {
    const { result } = renderHook(() => useTableQuery({ defaultLimit: 25 }))
    act(() => {
      result.current.setPage(3)
    })
    expect(result.current.state.offset).toBe(75)
    expect(result.current.currentPage).toBe(3)
  })

  it('toQueryParams returns correct object', () => {
    const { result } = renderHook(() =>
      useTableQuery({ defaultSort: 'id', defaultOrder: 'asc', defaultLimit: 10 })
    )
    act(() => {
      result.current.setFilter('decision', 'BUY')
    })
    const params = result.current.toQueryParams()
    expect(params.sort).toBe('id')
    expect(params.order).toBe('asc')
    expect(params.limit).toBe('10')
    expect(params.offset).toBe('0')
    expect(params.decision).toBe('BUY')
  })

  it('toQueryParams omits empty filter values', () => {
    const { result } = renderHook(() => useTableQuery())
    act(() => {
      result.current.setFilter('strategy', '')
    })
    const params = result.current.toQueryParams()
    expect('strategy' in params).toBe(false)
  })

  it('clearFilters resets filters to default', () => {
    const { result } = renderHook(() =>
      useTableQuery({ defaultFilters: { decision: 'BUY' } })
    )
    act(() => {
      result.current.setFilter('strategy', 'momentum')
      result.current.setFilter('decision', 'SKIP')
    })
    act(() => {
      result.current.clearFilters()
    })
    expect(result.current.state.filters).toEqual({ decision: 'BUY' })
  })
})
