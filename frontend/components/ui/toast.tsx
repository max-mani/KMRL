"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

// Enhanced toast system with better UX
interface ToastProps {
  id: string
  title?: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: (id: string) => void
  action?: {
    label: string
    onClick: () => void
  }
}

function Toast({
  id,
  title,
  description,
  type = 'info',
  duration = 5000,
  onClose,
  action
}: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(id), 300) // Wait for animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, id, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(id), 300)
  }

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info
  }

  const colors = {
    success: 'border-green-200 bg-green-50 text-green-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800'
  }

  const Icon = icons[type]

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300',
        colors[type],
        isVisible ? 'animate-in slide-in-from-right-full' : 'animate-out slide-out-to-right-full'
      )}
    >
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-medium text-sm">{title}</h4>
        )}
        {description && (
          <p className="text-sm mt-1 opacity-90">{description}</p>
        )}
        {action && (
          <Button
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            className="mt-2 h-6 px-2 text-xs"
          >
            {action.label}
          </Button>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClose}
        className="h-6 w-6 p-0 flex-shrink-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

// Toast container
interface ToastContainerProps {
  toasts: ToastProps[]
  onRemoveToast: (id: string) => void
}

function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemoveToast}
        />
      ))}
    </div>
  )
}

// Toast hook for easy usage
interface ToastOptions {
  title?: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = React.useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast: ToastProps = {
      id,
      ...options
    }
    
    setToasts(prev => [...prev, toast])
    return id
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = React.useCallback((options: Omit<ToastOptions, 'type'>) => {
    return addToast({ ...options, type: 'success' })
  }, [addToast])

  const error = React.useCallback((options: Omit<ToastOptions, 'type'>) => {
    return addToast({ ...options, type: 'error' })
  }, [addToast])

  const warning = React.useCallback((options: Omit<ToastOptions, 'type'>) => {
    return addToast({ ...options, type: 'warning' })
  }, [addToast])

  const info = React.useCallback((options: Omit<ToastOptions, 'type'>) => {
    return addToast({ ...options, type: 'info' })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}

// Toast provider component
interface ToastProviderProps {
  children: React.ReactNode
}

function ToastProvider({ children }: ToastProviderProps) {
  const { toasts, removeToast } = useToast()

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  )
}

export { Toast, ToastContainer, useToast, ToastProvider }