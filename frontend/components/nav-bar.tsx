"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { useEffect, useState } from "react"

interface User {
  firstName: string
}

const links = [
  { href: "/dashboard", label: "Fleet Status" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/performance", label: "System Performance" },
  { href: "/insights", label: "Critical Insights" },
  { href: "/history", label: "Historical Data" },
  { href: "/digital-twin", label: "What-If Digital Twin" },
  { href: "/upload", label: "Upload Data" },
]

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("kmrl-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [pathname]) // Rerun on route change

  const handleLogout = () => {
    localStorage.removeItem("kmrl-user")
    localStorage.removeItem("kmrl-token")
    setUser(null)
    router.push("/login")
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/Koch_Metro_Logo.png"
            alt="Kochi Metro Rail Limited Logo"
            className="h-8 w-auto"
          />
          <span className="font-semibold text-lg">KMRL</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname?.startsWith(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-2 py-1 rounded-md text-sm ${active ? "bg-muted" : "hover:bg-muted"}`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  {user.firstName}
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-[var(--kmrl-teal)] text-white hover:opacity-90">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
