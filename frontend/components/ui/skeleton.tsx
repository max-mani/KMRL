import * as React from 'react'
import { cn } from '@/lib/utils'

// Skeleton component for general use
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      {...props}
    />
  )
}

// Card skeleton component
function CardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6 shadow-sm',
        className
      )}
      {...props}
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  )
}

// Table skeleton component
function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  rows?: number
  columns?: number
}) {
  return (
    <div className={cn('overflow-auto rounded-md border', className)} {...props}>
      <table className="min-w-[720px] w-full text-sm">
        <thead className="bg-muted">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-3 py-2 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="even:bg-muted/40">
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="px-3 py-2">
                  <Skeleton className="h-4 w-16" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Chart skeleton component
function ChartSkeleton({ 
  height = 300, 
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  height?: number
}) {
  return (
    <div 
      className={cn('flex items-center justify-center', className)}
      style={{ height }}
      {...props}
    >
      <div className="space-y-4 w-full">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

// Dashboard skeleton for loading states
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Table skeleton */}
      <CardSkeleton>
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <TableSkeleton rows={8} columns={5} />
        </div>
      </CardSkeleton>
    </div>
  )
}

// Analytics skeleton
function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Insights cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton>
          <ChartSkeleton height={300} />
        </CardSkeleton>
        <CardSkeleton>
          <ChartSkeleton height={300} />
        </CardSkeleton>
      </div>
    </div>
  )
}

export {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  DashboardSkeleton,
  AnalyticsSkeleton
}