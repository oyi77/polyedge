import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable, ColumnDef } from '../components/DataTable'

interface Row {
  id: number
  name: string
  value: number
}

const columns: ColumnDef<Row>[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'value', label: 'Value', sortable: true },
]

const rows: Row[] = [
  { id: 1, name: 'Alpha', value: 100 },
  { id: 2, name: 'Beta', value: 200 },
]

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} rows={rows} />)
    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Value')).toBeInTheDocument()
  })

  it('renders row data', () => {
    render(<DataTable columns={columns} rows={rows} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
  })

  it('shows empty message when no rows', () => {
    render(<DataTable columns={columns} rows={[]} emptyMessage="Nothing here" />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('shows default empty message when no rows and no emptyMessage', () => {
    render(<DataTable columns={columns} rows={[]} />)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('calls onSort when sortable header clicked', () => {
    const onSort = vi.fn()
    render(<DataTable columns={columns} rows={rows} onSort={onSort} />)
    fireEvent.click(screen.getByText('Name'))
    expect(onSort).toHaveBeenCalledWith('name')
  })

  it('does not call onSort when non-sortable header clicked', () => {
    const onSort = vi.fn()
    render(<DataTable columns={columns} rows={rows} onSort={onSort} />)
    fireEvent.click(screen.getByText('ID'))
    expect(onSort).not.toHaveBeenCalled()
  })

  it('calls onPageChange when next page clicked', () => {
    const onPageChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        rows={rows}
        total={200}
        limit={50}
        currentPage={0}
        onPageChange={onPageChange}
      />
    )
    fireEvent.click(screen.getByText('Next'))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('shows loading state when loading=true', () => {
    render(<DataTable columns={columns} rows={[]} loading={true} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('applies filter values to filterValues prop', () => {
    const filters = [
      { key: 'name', label: 'Name', type: 'text' as const, placeholder: 'Filter name' },
    ]
    render(
      <DataTable
        columns={columns}
        rows={rows}
        filters={filters}
        filterValues={{ name: 'test-value' }}
      />
    )
    const input = screen.getByPlaceholderText('Filter name') as HTMLInputElement
    expect(input.value).toBe('test-value')
  })

  it('shows sort indicator on active sort column', () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        sort="name"
        order="asc"
      />
    )
    expect(screen.getByText('↑')).toBeInTheDocument()
  })
})
