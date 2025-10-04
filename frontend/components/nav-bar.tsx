"use client"

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface User {
  firstName: string
}

const links = [
  { href: "/dashboard", label: "Fleet Status" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/performance", label: "System Performance" },
  { href: "/insights", label: "Critical Insights" },
  { href: "/history", label: "Historical Data" },
  { href: "/digital-twin", label: "What-If" },
  { href: "/upload", label: "Upload Data" },
  { href: "/analytics", label: "Overview" },
  { href: "/stations", label: "Stations" },
  { href: "/maps", label: "Route Maps" },
  { href: "/fares", label: "Fares" },
  { href: "/about", label: "About" },
]

// Mobile navigation component
function MobileNav({ user, handleLogout, handleNavClick }: {
  user: User | null
  handleLogout: () => void
  handleNavClick: (e: React.MouseEvent, href: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <img
              src="/Koch_Metro_Logo.png"
              alt="Kochi Metro Rail Limited Logo"
              className="h-8 w-auto"
            />
            <span className="font-semibold text-lg">KMRL</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            {links.map((link) => {
              const active = pathname?.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    handleNavClick(e, link.href)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    active 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <ThemeToggle />
              {user ? (
                <div className="flex items-center gap-2">
                  <Link href="/profile" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" size="sm">
                      {user.firstName}
                    </Button>
                  </Link>
                  <Button onClick={handleLogout} variant="outline" size="sm">
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    <Button size="sm" className="bg-[var(--kmrl-teal)] text-white hover:opacity-90">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Desktop navigation with enhanced active states
function DesktopNav({ user, handleLogout, handleNavClick }: {
  user: User | null
  handleLogout: () => void
  handleNavClick: (e: React.MouseEvent, href: string) => void
}) {
  const pathname = usePathname()

  return (
    <nav className="hidden lg:flex items-center gap-1">
      {links.map((link) => {
        const active = pathname?.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={(e) => handleNavClick(e, link.href)}
            className={cn(
              'px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 relative',
              active 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-muted hover:text-foreground'
            )}
            aria-current={active ? 'page' : undefined}
          >
            {link.label}
            {active && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-foreground rounded-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("kmrl-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem("kmrl-user")
    localStorage.removeItem("kmrl-token")
    setUser(null)
    router.push("/login")
  }

  const protectedRoutes = new Set(["/dashboard", "/maintenance", "/performance", "/analytics", "/insights", "/history", "/digital-twin", "/what-if", "/upload"])
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (protectedRoutes.has(href) && !user) {
      e.preventDefault()
      router.push("/login")
    }
  }

  return (
    <header className="border-b bg-card sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img
            src="/Koch_Metro_Logo.png"
            alt="Kochi Metro Rail Limited Logo"
            className="h-8 w-auto"
          />
          <span className="font-semibold text-lg">KMRL</span>
        </Link>

        <DesktopNav user={user} handleLogout={handleLogout} handleNavClick={handleNavClick} />

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <MobileNav user={user} handleLogout={handleLogout} handleNavClick={handleNavClick} />
          {user ? (
            <div className="hidden lg:flex items-center gap-2">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="hover:bg-muted">
                  {user.firstName}
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2">
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
            </div>
          )}
        </div>
      </div>
    </header>
  )
}