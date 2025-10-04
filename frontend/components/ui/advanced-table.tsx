import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'

// Search component with advanced filtering
interface SearchFilterProps {
  placeholder?: string
  onSearch?: (query: string) => void
  onFilter?: (filters: Record<string, any>) => void
  className?: string
}

function SearchFilter({ 
  placeholder = "Search...", 
  onSearch, 
  onFilter,
  className 
}: SearchFilterProps) {
  const [query, setQuery] = React.useState('')
  const [filters, setFilters] = React.useState<Record<string, any>>({})
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)

  const handleSearch = React.useCallback((value: string) => {
    setQuery(value)
    onSearch?.(value)
  }, [onSearch])

  const handleFilterChange = React.useCallback((key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilter?.(newFilters)
  }, [filters, onFilter])

  const clearFilters = React.useCallback(() => {
    setFilters({})
    onFilter?.({})
  }, [onFilter])

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            
            {/* Example filter options - customize based on your data */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <div className="space-y-2">
                  {['Running', 'Standby', 'Maintenance'].map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.status === status}
                        onCheckedChange={(checked) => 
                          handleFilterChange('status', checked ? status : null)
                        }
                      />
                      <label htmlFor={`status-${status}`} className="text-sm">
                        {status}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Score Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={filters.minScore || ''}
                    onChange={(e) => handleFilterChange('minScore', e.target.value ? Number(e.target.value) : null)}
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={filters.maxScore || ''}
                    onChange={(e) => handleFilterChange('maxScore', e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Advanced data table with filtering and sorting
interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  filterable?: boolean
  className?: string
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  filterable = true,
  className
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filters, setFilters] = React.useState<Record<string, any>>({})
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof T | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })

  const filteredData = React.useMemo(() => {
    let filtered = data

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        filtered = filtered.filter(row => {
          const rowValue = row[key]
          if (typeof value === 'string') {
            return String(rowValue).toLowerCase().includes(value.toLowerCase())
          }
          if (typeof value === 'number') {
            return Number(rowValue) >= value
          }
          return rowValue === value
        })
      }
    })

    return filtered
  }, [data, searchQuery, filters])

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortConfig])

  const handleSort = (key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  return (
    <div className={cn('space-y-4', className)}>
      {(searchable || filterable) && (
        <SearchFilter
          placeholder="Search data..."
          onSearch={setSearchQuery}
          onFilter={setFilters}
        />
      )}
      
      <div className="overflow-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-3 py-2 text-left font-medium"
                >
                  <button
                    className={cn(
                      'flex items-center gap-1 hover:text-foreground transition-colors',
                      column.sortable && 'cursor-pointer'
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                    disabled={!column.sortable}
                  >
                    {column.label}
                    {column.sortable && (
                      <ChevronDown className={cn(
                        'h-3 w-3 transition-transform',
                        sortConfig.key === column.key && sortConfig.direction === 'desc' && 'rotate-180'
                      )} />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr key={index} className="even:bg-muted/40 hover:bg-muted/60 transition-colors">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-3 py-2">
                    {column.render 
                      ? column.render(row[column.key], row)
                      : String(row[column.key] || '')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {sortedData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No data found matching your criteria
        </div>
      )}
    </div>
  )
}

export { SearchFilter, DataTable }
