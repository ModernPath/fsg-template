'use client'

import React, { Component, type ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to error tracking service (e.g., Sentry)
    // logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Something went wrong</CardTitle>
                <CardDescription>
                  An error occurred while rendering this component
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error message */}
            {this.state.error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                  Error:
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Error details (development only) */}
            {this.props.showDetails && this.state.errorInfo && (
              <details className="p-4 rounded-lg bg-muted border">
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  Technical Details
                </summary>
                <pre className="text-xs overflow-auto max-h-64 mt-2 p-2 bg-background rounded">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button onClick={this.handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>

            {/* Help text */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                If this problem persists, please contact support with the error details above.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for easier use with hooks
interface ErrorBoundaryWrapperProps {
  children: ReactNode
  fallbackComponent?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: Array<string | number>
}

export function ErrorBoundaryWrapper({ 
  children, 
  fallbackComponent,
  onError,
  resetKeys = []
}: ErrorBoundaryWrapperProps) {
  const [key, setKey] = React.useState(0)

  React.useEffect(() => {
    setKey(prev => prev + 1)
  }, resetKeys)

  return (
    <ErrorBoundary
      key={key}
      fallback={fallbackComponent}
      onError={onError}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      {children}
    </ErrorBoundary>
  )
}

// Specific error boundaries for different sections
export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Dashboard Error
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                We couldn't load your dashboard. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      }
      showDetails={process.env.NODE_ENV === 'development'}
    >
      {children}
    </ErrorBoundary>
  )
}

export function ChartErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-[300px] border rounded-lg bg-muted/30">
          <div className="text-center p-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Chart could not be loaded
            </p>
          </div>
        </div>
      }
      showDetails={false}
    >
      {children}
    </ErrorBoundary>
  )
}

