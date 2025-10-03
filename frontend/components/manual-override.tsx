"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Edit2, Check, X } from "lucide-react"

type OverrideMap = Record<string, any>

type ManualOverrideContextType = {
  overrides: OverrideMap
  setOverride: (key: string, value: any) => void
  clearOverride: (key: string) => void
  clearAll: () => void
}

const ManualOverrideContext = createContext<ManualOverrideContextType | null>(null)

const STORAGE_KEY = "kmrl-manual-overrides"
const apiBase = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001')

export function ManualOverrideProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<OverrideMap>({})

  useEffect(() => {
    (async () => {
      // optimistic load from local cache
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) setOverrides(JSON.parse(saved))
      } catch {}
      // fetch from API
      try {
        const resp = await fetch(`${apiBase}/api/overrides`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}` }
        })
        if (resp.ok) {
          const data = await resp.json()
          if (data?.data?.overrides) setOverrides(data.data.overrides)
        }
      } catch {}
    })()
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides)) } catch {}
  }, [overrides])

  const setOverride = useCallback((key: string, value: any) => {
    setOverrides(prev => {
      const next = { ...prev, [key]: value }
      // fire and forget save to API
      try {
        fetch(`${apiBase}/api/overrides`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}`
          },
          body: JSON.stringify({ overrides: { [key]: value } })
        })
      } catch {}
      return next
    })
  }, [])

  const clearOverride = useCallback((key: string) => {
    setOverrides(prev => {
      const next = { ...prev }
      delete next[key]
      // fire and forget delete to API
      try {
        fetch(`${apiBase}/api/overrides/${encodeURIComponent(key)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}` }
        })
      } catch {}
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setOverrides(prev => {
      const next = {}
      // replace on server
      try {
        fetch(`${apiBase}/api/overrides`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}`
          },
          body: JSON.stringify({ overrides: next })
        })
      } catch {}
      return next
    })
  }, [])

  const value = useMemo(() => ({ overrides, setOverride, clearOverride, clearAll }), [overrides, setOverride, clearOverride, clearAll])

  return (
    <ManualOverrideContext.Provider value={value}>
      {children}
    </ManualOverrideContext.Provider>
  )
}

export function useManualOverride() {
  const ctx = useContext(ManualOverrideContext)
  if (!ctx) throw new Error("useManualOverride must be used within ManualOverrideProvider")
  return ctx
}

export function useOverride<T = any>(key: string, initial?: T) {
  const { overrides, setOverride, clearOverride } = useManualOverride()
  const value = (key in overrides) ? (overrides[key] as T) : initial
  return { value, set: (v: T) => setOverride(key, v), clear: () => clearOverride(key), isOverridden: key in overrides }
}

type EditableValueProps = {
  id: string
  value: string | number
  onChange?: (v: string | number) => void
  type?: "text" | "number"
  min?: number
  max?: number
  step?: number
  className?: string
}

export function EditableValue({ id, value, onChange, type = "text", min, max, step, className }: EditableValueProps) {
  const { value: override, set, clear, isOverridden } = useOverride(id, value)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string | number>(override ?? value)
  const [justSaved, setJustSaved] = useState(false)
  const display = override ?? value

  const startEdit = () => { setDraft(display as any); setEditing(true) }
  const cancelEdit = () => { setEditing(false); setDraft(display as any) }
  const saveEdit = () => {
    const next = type === "number" ? Number(draft || 0) : draft
    set(next)
    onChange?.(next as any)
    setEditing(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1000)
  }
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  if (!editing) {
    return (
      <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ display: "inline-block", position: 'relative' }}>
          {String(display)}
          {justSaved && (
            <span
              title="Saved"
              style={{
                position: 'absolute', right: -10, top: -6, width: 6, height: 6, borderRadius: 9999,
                background: 'var(--kmrl-teal)'
              }}
            />
          )}
        </span>
        <button
          onClick={startEdit}
          aria-label="Edit"
          title="Edit"
          className="inline-flex items-center justify-center w-6 h-6 rounded border border-border text-muted-foreground hover:bg-muted/60 dark:hover:bg-muted/40 hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--kmrl-teal)]"
        >
          <Edit2 size={14} />
        </button>
        {isOverridden && (
          <button
            onClick={() => clear()}
            style={{ fontSize: 12, padding: "2px 6px", border: "1px solid #ddd", borderRadius: 4, background: "#fff", cursor: "pointer" }}
            title="Reset to original"
          >
            Reset
          </button>
        )}
      </span>
    )
  }

  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {type === "number" ? (
        <input
          type="number"
          value={String(draft)}
          min={min}
          max={max}
          step={step}
          onChange={(e) => setDraft(e.target.value === "" ? 0 : Number(e.target.value))}
          onKeyDown={onKeyDown}
          autoFocus
          style={{ border: "1px solid #ddd", borderRadius: 6, padding: "2px 6px", width: 80 }}
        />
      ) : (
        <input
          type="text"
          value={String(draft)}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          style={{ border: "1px solid #ddd", borderRadius: 6, padding: "2px 6px" }}
        />
      )}
      <button
        onClick={saveEdit}
        aria-label="Save"
        title="Save"
        className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded border border-border text-white"
        style={{ backgroundColor: 'var(--kmrl-teal)' }}
      >
        <Check size={14} />
      </button>
      <button
        onClick={cancelEdit}
        aria-label="Cancel"
        title="Cancel"
        className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded border border-border text-muted-foreground hover:bg-muted/60 dark:hover:bg-muted/40 hover:text-foreground transition-colors"
      >
        <X size={14} />
      </button>
    </span>
  )
}


