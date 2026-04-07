import { ReactNode } from 'react'

export interface ColumnDef<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T, value: unknown) => ReactNode
  className?: string
}

export interface FilterDef {
  key: string
  label: string
  type: 'text' | 'select' | 'number'
  options?: Array<{ label: string; value: string }>
  placeholder?: string
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  rows: T[]
  total?: number
  sort?: string
  order?: 'asc' | 'desc'
  limit?: number
  currentPage?: number
  onSort?: (col: string) => void
  onPageChange?: (page: number) => void
  filters?: FilterDef[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  loading?: boolean
  emptyMessage?: string
  keyField?: string
}

export function DataTable<T extends object>({
  columns,
  rows,
  total = 0,
  sort,
  order = 'desc',
  limit = 50,
  currentPage = 0,
  onSort,
  onPageChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  loading = false,
  emptyMessage = 'No data',
  keyField = 'id',
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-3">
      {/* Filter Bar */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-3 border-b border-neutral-800">
          {filters.map(f => (
            <div key={f.key} className="flex flex-col gap-0.5">
              <span className="text-[9px] text-neutral-600 uppercase tracking-wider">{f.label}</span>
              {f.type === 'select' ? (
                <select
                  value={filterValues[f.key] ?? ''}
                  onChange={e => onFilterChange?.(f.key, e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px] px-2 py-0.5 font-mono focus:border-neutral-500 focus:outline-none"
                >
                  <option value="">All</option>
                  {f.options?.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={filterValues[f.key] ?? ''}
                  onChange={e => onFilterChange?.(f.key, e.target.value)}
                  placeholder={f.placeholder ?? f.label}
                  className="bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px] px-2 py-0.5 font-mono focus:border-neutral-500 focus:outline-none w-36"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-neutral-800">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`text-left text-[9px] text-neutral-500 uppercase tracking-wider py-1.5 pr-4 ${col.sortable ? 'cursor-pointer hover:text-neutral-300 select-none' : ''} ${col.className ?? ''}`}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  {col.label}
                  {col.sortable && sort === col.key && (
                    <span className="ml-1 text-green-500">{order === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-neutral-600">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-neutral-600">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={String((row as Record<string, unknown>)[keyField] ?? idx)}
                  className="border-b border-neutral-900 hover:bg-neutral-900/50 transition-colors"
                >
                  {columns.map(col => (
                    <td key={col.key} className={`py-1.5 pr-4 text-neutral-300 ${col.className ?? ''}`}>
                      {col.render
                        ? col.render(row, (row as Record<string, unknown>)[col.key])
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
          <span className="text-[9px] text-neutral-600">
            {total} total · page {currentPage + 1}/{totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 0}
              className="px-2 py-0.5 text-[9px] border border-neutral-700 text-neutral-400 disabled:opacity-30 hover:border-neutral-500 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="px-2 py-0.5 text-[9px] border border-neutral-700 text-neutral-400 disabled:opacity-30 hover:border-neutral-500 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
