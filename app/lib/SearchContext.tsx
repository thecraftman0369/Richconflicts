'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

type SearchContextType = {
  isOpen: boolean
  query: string
  setQuery: (q: string) => void
  open: () => void
  close: () => void
}

const SearchContext = createContext<SearchContextType | null>(null)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
  }, [])

  return (
    <SearchContext.Provider value={{ isOpen, query, setQuery, open, close }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch(): SearchContextType {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearch must be inside <SearchProvider>')
  return ctx
}
