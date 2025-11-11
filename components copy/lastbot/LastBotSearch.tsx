'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface SearchResult {
  id: string
  title: string
  content: string
  url?: string
  score?: number
}

interface LastBotSearchProps {
  className?: string
}

export default function LastBotSearch({ className }: LastBotSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const params = useParams()
  const locale = params.locale as string || 'en'

  // Get configuration from environment
  const widgetId = process.env.NEXT_PUBLIC_LASTBOT_WIDGET_ID
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_LASTBOT_ONE === 'true'

  // Check if we're on localhost
  useEffect(() => {
    const checkLocalhost = () => {
      const hostname = window.location.hostname
      return hostname === 'localhost' || 
             hostname === '127.0.0.1' ||
             hostname.includes('localhost')
    }
    setIsLocalhost(checkLocalhost())
  }, [])

  // Don't render if LastBot is not enabled or on localhost in development
  if (!isEnabled || (isLocalhost && process.env.NODE_ENV === 'development')) {
    return null
  }

  const searchUrl = `/api/lastbot-proxy`

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: searchQuery, locale, widget_id: widgetId }),
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Handle different possible response formats
      let searchResults: SearchResult[] = []
      
      if (Array.isArray(data)) {
        searchResults = data
      } else if (data.results && Array.isArray(data.results)) {
        searchResults = data.results
      } else if (data.data && Array.isArray(data.data)) {
        searchResults = data.data
      } else {
        console.warn('Unexpected search response format:', data)
        searchResults = []
      }

      setResults(searchResults)
      setIsExpanded(true)
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search - wait 500ms after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(newQuery)
    }, 500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    performSearch(query)
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setError(null)
    setIsExpanded(false)
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={`relative ${className || ''}`}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search for information..."
            className="w-full px-4 py-2 pl-10 pr-12 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-1 top-1 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </h3>
            <button
              onClick={toggleExpanded}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>

          <div className={`space-y-3 ${isExpanded ? '' : 'max-h-48 overflow-hidden'}`}>
            {results.map((result, index) => (
              <div
                key={result.id || index}
                className="p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
              >
                <h4 className="font-medium text-gray-900 mb-1">
                  {result.title || `Result ${index + 1}`}
                </h4>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {result.content}
                </p>
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                  >
                    View source →
                  </a>
                )}
                {result.score && (
                  <span className="text-xs text-gray-500 ml-2">
                    Score: {Math.round(result.score * 100)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-800">Searching...</span>
          </div>
        </div>
      )}
    </div>
  )
} 