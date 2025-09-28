"use client"

import { useEffect } from "react"

export default function LogoutPage() {
  useEffect(() => {
    localStorage.removeItem("kmrl-user")
    window.location.href = "/"
  }, [])
  return (
    <div className="container mx-auto px-4 py-12">
      <p>Signing you out…</p>
    </div>
  )
}
