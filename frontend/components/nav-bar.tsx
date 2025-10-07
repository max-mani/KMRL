"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

interface User {
  firstName: string
}

const links = [
  { href: "/dashboard", label: "Fleet Status" },
  { href: "/upload", label: "Scheduler" },
  { href: "/manual-override", label: "Manual Override" },
  { href: "/analytics", label: "Analysis Overview", hasDropdown: true },
  { href: "/analytics/operations", label: "Operations" },
  { href: "/about", label: "About" },
]

const analysisOverviewItems = [
  { href: "/analytics", label: "Analysis Overview" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/performance", label: "System Performance" },
  { href: "/insights", label: "Critical Insights" },
  { href: "/history", label: "Historical Data" },
  { href: "/stations", label: "Stations" },
  { href: "/maps", label: "Route Maps" },
  { href: "/fares", label: "Fares" },
]

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [selectedDropdownItem, setSelectedDropdownItem] = useState<string>("Analysis Overview")

  useEffect(() => {
    const storedUser = localStorage.getItem("kmrl-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [pathname]) // Rerun on route change

  // Update selected dropdown item based on current path
  useEffect(() => {
    const currentItem = analysisOverviewItems.find(item => pathname?.startsWith(item.href))
    if (currentItem) {
      setSelectedDropdownItem(currentItem.label)
    } else {
      setSelectedDropdownItem("Analysis Overview")
    }
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem("kmrl-user")
    localStorage.removeItem("kmrl-token")
    setUser(null)
    router.push("/login")
  }

  const protectedRoutes = new Set(["/dashboard", "/maintenance", "/performance", "/analytics", "/insights", "/history", "/digital-twin", "/what-if", "/upload", "/stations", "/maps", "/fares", "/manual-override"])
  // include operations under analytics
  protectedRoutes.add('/analytics/operations')
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (protectedRoutes.has(href) && !user) {
      e.preventDefault()
      router.push("/login")
    }
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
            
            if (l.hasDropdown) {
              return (
                <DropdownMenu key={l.href}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`px-2 py-1 rounded-md text-sm flex items-center gap-1 ${active ? "bg-muted" : "hover:bg-muted"}`}
                      onClick={() => console.log('Dropdown trigger clicked')}
                    >
                      {selectedDropdownItem}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 z-50">
                    {analysisOverviewItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          onClick={(e) => {
                            handleNavClick(e, item.href)
                            setSelectedDropdownItem(item.label)
                          }}
                          className="w-full cursor-pointer"
                        >
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }
            
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={(e) => handleNavClick(e, l.href)}
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
