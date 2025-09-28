"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("kmrl-theme")
    const initialDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDark(initialDark)
    document.documentElement.classList.toggle("dark", initialDark)
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("kmrl-theme", next ? "dark" : "light")
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle dark mode" onClick={toggle} className="rounded-full">
      {isDark ? "🌙" : "☀️"}
    </Button>
  )
}
