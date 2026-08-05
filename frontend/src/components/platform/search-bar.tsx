'use client'

import { useState } from 'react'
import { Icon } from '@/lib/icons'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
  { label: 'Draft', value: 'draft' },
]

const dateRangeOptions = [
  { label: 'All Time', value: '' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
]

interface SearchBarProps {
  onSearch: (query: string) => void
  onFilter: (filters: Record<string, string>) => void
  weddings?: { label: string; value: string }[]
  totalResults?: number
  placeholder?: string
}

export function SearchBar({ onSearch, onFilter, weddings, totalResults, placeholder = 'Search...' }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [wedding, setWedding] = useState('')
  const [dateRange, setDateRange] = useState('')

  const hasFilters = query || status || wedding || dateRange

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch(value)
  }

  const applyFilter = (key: string, value: string) => {
    const filters: Record<string, string> = {}
    if (key === 'status') setStatus(value)
    if (key === 'wedding') setWedding(value)
    if (key === 'dateRange') setDateRange(value)
    filters.status = key === 'status' ? value : status
    filters.wedding = key === 'wedding' ? value : wedding
    filters.dateRange = key === 'dateRange' ? value : dateRange
    if (query) filters.query = query
    onFilter(filters)
  }

  const clearFilters = () => {
    setQuery('')
    setStatus('')
    setWedding('')
    setDateRange('')
    onSearch('')
    onFilter({})
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[220px] flex-1">
        <Input
          placeholder={placeholder}
          value={query}
          onChange={e => handleSearch(e.target.value)}
          icon={<Icon name="search" size={16} />}
        />
      </div>

      {weddings && (
        <div className="w-full sm:w-48">
          <Select
            placeholder="All Weddings"
            options={weddings}
            value={wedding}
            onChange={e => applyFilter('wedding', e.target.value)}
          />
        </div>
      )}

      <div className="w-full sm:w-40">
        <Select
          placeholder="Status"
          options={statusOptions}
          value={status}
          onChange={e => applyFilter('status', e.target.value)}
        />
      </div>

      <div className="w-full sm:w-40">
        <Select
          placeholder="Date Range"
          options={dateRangeOptions}
          value={dateRange}
          onChange={e => applyFilter('dateRange', e.target.value)}
        />
      </div>

      {totalResults !== undefined && (
        <p className="whitespace-nowrap text-sm text-muted">
          {totalResults} result{totalResults !== 1 ? 's' : ''}
        </p>
      )}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <Icon name="x" size={14} />
          Clear
        </Button>
      )}
    </div>
  )
}
