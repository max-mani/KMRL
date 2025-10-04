import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home, ChevronRight } from 'lucide-react'

// Enhanced error component with retry functionality
interface ErrorBoundaryProps {
  error?: Error | string
  retry?: () => void
  fallback?: React.ReactNode
  className?: string
}

function ErrorDisplay({ 
  error, 
  retry, 
  fallback, 
  className 
}: ErrorBoundaryProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'An unexpected error occurred'
  
  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        {errorMessage}
      </p>
      {retry && (
        <Button onClick={retry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  )
}

// Breadcrumb component for navigation
interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}>
      <Home className="h-4 w-4" />
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <a 
              href={item.href} 
              className="hover:text-foreground transition-colors"
              aria-label={`Navigate to ${item.label}`}
            >
              {item.label}
            </a>
          ) : (
            <span className="text-foreground font-medium" aria-current="page">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

// Enhanced loading component with better UX
interface LoadingProps {
  message?: string
  progress?: number
  className?: string
}

function Loading({ message = 'Loading...', progress, className }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8', className)}>
      <div className="relative">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        {progress !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      {progress !== undefined && (
        <div className="w-48 mt-2">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Empty state component
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 max-w-md">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}

// Retry mechanism hook
function useRetry(maxRetries = 3) {
  const [retryCount, setRetryCount] = React.useState(0)
  const [isRetrying, setIsRetrying] = React.useState(false)

  const retry = React.useCallback(async (fn: () => Promise<any>) => {
    if (retryCount >= maxRetries) {
      throw new Error(`Maximum retry attempts (${maxRetries}) exceeded`)
    }

    setIsRetrying(true)
    try {
      const result = await fn()
      setRetryCount(0) // Reset on success
      return result
    } catch (error) {
      setRetryCount(prev => prev + 1)
      throw error
    } finally {
      setIsRetrying(false)
    }
  }, [retryCount, maxRetries])

  return { retry, retryCount, isRetrying, canRetry: retryCount < maxRetries }
}

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ReactNode }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ fallback?: React.ReactNode }>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay 
          error={this.state.error} 
          retry={() => this.setState({ hasError: false, error: undefined })}
          fallback={this.props.fallback}
        />
      )
    }

    return this.props.children
  }
}

export {
  ErrorDisplay,
  Breadcrumb,
  Loading,
  EmptyState,
  useRetry,
  ErrorBoundary
}
