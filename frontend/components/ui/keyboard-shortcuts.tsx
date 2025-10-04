"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, Search, Keyboard, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// Keyboard shortcut hook
interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
}

function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(({ key, ctrlKey, altKey, shiftKey, metaKey, action }) => {
        if (
          event.key.toLowerCase() === key.toLowerCase() &&
          !!event.ctrlKey === !!ctrlKey &&
          !!event.altKey === !!altKey &&
          !!event.shiftKey === !!shiftKey &&
          !!event.metaKey === !!metaKey
        ) {
          event.preventDefault()
          action()
        }
      })
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Command palette component
interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  commands: Array<{
    id: string
    title: string
    description?: string
    icon?: React.ReactNode
    action: () => void
    shortcut?: string
  }>
}

function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('')
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const filteredCommands = React.useMemo(() => {
    if (!query) return commands
    return commands.filter(command =>
      command.title.toLowerCase().includes(query.toLowerCase()) ||
      command.description?.toLowerCase().includes(query.toLowerCase())
    )
  }, [commands, query])

  React.useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
          break
        case 'Enter':
          event.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
            onClose()
          }
          break
        case 'Escape':
          event.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-2xl mx-4">
        <div className="flex items-center gap-2 p-4 border-b">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0"
            autoFocus
          />
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No commands found
            </div>
          ) : (
            <div className="p-2">
              {filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => {
                    command.action()
                    onClose()
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors',
                    index === selectedIndex 
                      ? 'bg-accent text-accent-foreground' 
                      : 'hover:bg-muted'
                  )}
                >
                  {command.icon && (
                    <div className="flex-shrink-0">
                      {command.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{command.title}</div>
                    {command.description && (
                      <div className="text-sm text-muted-foreground">
                        {command.description}
                      </div>
                    )}
                  </div>
                  {command.shortcut && (
                    <Badge variant="outline" className="text-xs">
                      {command.shortcut}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Command palette hook
export function useCommandPalette() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [commands, setCommands] = React.useState<CommandPaletteProps['commands']>([])

  const addCommand = React.useCallback((command: CommandPaletteProps['commands'][0]) => {
    setCommands(prev => [...prev, command])
  }, [])

  const removeCommand = React.useCallback((id: string) => {
    setCommands(prev => prev.filter(cmd => cmd.id !== id))
  }, [])

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])

  // Default keyboard shortcut to open command palette
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      action: open,
      description: 'Open command palette'
    }
  ])

  return {
    isOpen,
    commands,
    addCommand,
    removeCommand,
    open,
    close
  }
}

// Keyboard shortcuts help component
interface KeyboardShortcutsHelpProps {
  shortcuts: Array<{
    key: string
    description: string
    category?: string
  }>
  isOpen: boolean
  onClose: () => void
}

function KeyboardShortcutsHelp({ shortcuts, isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const groupedShortcuts = React.useMemo(() => {
    const groups: Record<string, typeof shortcuts> = {}
    shortcuts.forEach(shortcut => {
      const category = shortcut.category || 'General'
      if (!groups[category]) groups[category] = []
      groups[category].push(shortcut)
    })
    return groups
  }, [shortcuts])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-2xl max-h-96 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="overflow-y-auto max-h-80">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="p-4">
              <h3 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge variant="outline" className="text-xs">
                      {shortcut.key}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export {
  useKeyboardShortcuts,
  CommandPalette,
  KeyboardShortcutsHelp
}
