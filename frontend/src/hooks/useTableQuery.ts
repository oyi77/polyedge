import { useState, useCallback } from 'react'

export interface TableQueryState {
  sort: string
  order: 'asc' | 'desc'
  limit: number
  offset: number
  filters: Record<string, string>
}

export interface UseTableQueryOptions {
  defaultSort?: string
  defaultOrder?: 'asc' | 'desc'
  defaultLimit?: number
  defaultFilters?: Record<string, string>
}

export function useTableQuery(options: UseTableQueryOptions = {}) {
  const {
    defaultSort = 'created_at',
    defaultOrder = 'desc',
    defaultLimit = 50,
    defaultFilters = {},
  } = options

  const [state, setState] = useState<TableQueryState>({
    sort: defaultSort,
    order: defaultOrder,
    limit: defaultLimit,
    offset: 0,
    filters: defaultFilters,
  })

  const setSort = useCallback((col: string) => {
    setState(prev => ({
      ...prev,
      offset: 0,
      order: prev.sort === col && prev.order === 'asc' ? 'desc' : 'asc',
      sort: col,
    }))
  }, [])

  const setFilter = useCallback((key: string, value: string) => {
    setState(prev => ({ ...prev, offset: 0, filters: { ...prev.filters, [key]: value } }))
  }, [])

  const clearFilters = useCallback(() => {
    setState(prev => ({ ...prev, offset: 0, filters: defaultFilters }))
  }, [defaultFilters])

  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, offset: page * prev.limit }))
  }, [])

  const currentPage = Math.floor(state.offset / state.limit)

  const toQueryParams = useCallback(() => {
    const params: Record<string, string> = {
      sort: state.sort,
      order: state.order,
      limit: String(state.limit),
      offset: String(state.offset),
    }
    Object.entries(state.filters).forEach(([k, v]) => {
      if (v) params[k] = v
    })
    return params
  }, [state])

  return { state, setSort, setFilter, clearFilters, setPage, currentPage, toQueryParams }
}
