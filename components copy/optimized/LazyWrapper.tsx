'use client'

import { Suspense, lazy, ComponentType, ReactNode } from 'react'

interface LazyWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

// Loading skeleton component
function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-800 rounded-lg h-64 w-full"></div>
    </div>
  )
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }))
  
  return function LazyLoadedComponent(props: P) {
    return (
      <Suspense fallback={fallback || <LoadingSkeleton />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Wrapper for lazy loading sections
export default function LazyWrapper({ 
  children, 
  fallback = <LoadingSkeleton />, 
  className = '' 
}: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      <div className={className}>
        {children}
      </div>
    </Suspense>
  )
}

// Specific loading skeletons for different content types
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-800 rounded-lg h-64 p-6">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-5/6 mb-4"></div>
            <div className="h-8 bg-gray-700 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col lg:flex-row items-center gap-16">
        <div className="w-full lg:w-1/2">
          <div className="h-12 bg-gray-800 rounded w-3/4 mb-6"></div>
          <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-4/5 mb-6"></div>
          <div className="h-12 bg-gray-700 rounded w-48"></div>
        </div>
        <div className="w-full lg:w-1/2">
          <div className="bg-gray-800 rounded-lg h-96 w-full"></div>
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="h-12 bg-gray-700 mb-1"></div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-6">
            <div className="h-4 bg-gray-700 rounded w-1/4 mr-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/3 mr-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/6 mr-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/5"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
