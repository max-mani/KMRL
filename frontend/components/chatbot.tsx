"use client"
import { useEffect, useMemo, useRef, useState } from "react"

type Message = { id: string; role: "user" | "assistant"; content: string }

function getApiBase() {
  if (typeof window === "undefined") return "";
  return process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "assistant",
    content: "Hi! I’m the KMRL assistant. Ask me about fleet optimization, uploads, or insights."
  }])
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isOpen])

  const apiUrl = useMemo(() => `${getApiBase()}/api/chat/message`, [])

  async function sendMessage() {
    const text = input.trim()
    if (!text) return
    setInput("")
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setSending(true)
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token')
        if (token && token.split('.').length === 3) headers['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: text })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || "Failed")
      const botMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: data.reply }
      setMessages(prev => [...prev, botMsg])
    } catch (err: any) {
      const errMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: `Error: ${err?.message || 'Something went wrong'}` }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setSending(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!sending) sendMessage()
    }
  }

  return (
    <>
      <button
        aria-label={isOpen ? "Close chat" : "Open chat"}
        onClick={() => setIsOpen(v => !v)}
        style={{
          position: "fixed",
          right: "20px",
          bottom: "20px",
          width: "56px",
          height: "56px",
          borderRadius: "9999px",
          background: "transparent",
          color: "var(--primary-foreground)",
          boxShadow: "0 10px 24px -12px rgba(0,0,0,0.35)",
          zIndex: 50,
          padding: 0,
          border: "none",
        }}
      >
        {isOpen ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '9999px',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontSize: 18,
            lineHeight: 1
          }}>✕</span>
        ) : (
          <img
            src="/chatbot.jpg"
            alt="Chatbot"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '9999px',
              border: '2px solid black',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            right: "20px",
            bottom: "84px",
            width: "360px",
            maxWidth: "90vw",
            height: "520px",
            maxHeight: "70vh",
            background: "var(--card)",
            color: "var(--card-foreground)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            zIndex: 50,
          }}
        >
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 600 }}>KMRL Assistant</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{sending ? "Thinking…" : "Online"}</div>
          </div>

          <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "10px 12px", gap: 8, display: "flex", flexDirection: "column" }}>
            {messages.map(m => (
              <div key={m.id} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'var(--primary)' : 'var(--secondary)',
                color: m.role === 'user' ? 'var(--primary-foreground)' : 'var(--secondary-foreground)',
                borderRadius: 10,
                padding: '8px 10px',
                maxWidth: '85%'
              }}>
                {m.content}
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", padding: 8, display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask something…"
              style={{
                flex: 1,
                border: "1px solid var(--input)",
                borderRadius: 8,
                padding: "8px 10px",
                outline: "none",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
              }}
            />
            <button
              onClick={() => !sending && sendMessage()}
              disabled={sending}
              style={{
                borderRadius: 8,
                padding: "8px 12px",
                background: sending ? "var(--muted)" : "var(--primary)",
                color: sending ? "var(--muted-foreground)" : "var(--primary-foreground)",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  )
}


