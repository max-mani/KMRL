"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

interface User {
  firstName: string
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("kmrl-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[var(--kmrl-teal)]/10 via-background to-[var(--kmrl-accent)]/10">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col items-center gap-8 text-center">
            {/* Brand */}
            <div className="flex items-center gap-4">
              <img
                src="/Koch_Metro_Logo.png"
                alt="Kochi Metro Rail Limited Logo"
                className="h-16 w-auto"
              />
              <div className="text-left">
                <p className="text-sm text-muted-foreground">KMRL</p>
                <h1 className="text-balance text-3xl md:text-4xl font-bold" style={{ color: "var(--kmrl-teal)" }}>
                  Kochi Metro Rail Limited
                </h1>
                <p className="text-lg text-muted-foreground">Fleet Optimization Platform</p>
              </div>
            </div>

            {/* Hero Description */}
            <p className="max-w-3xl text-pretty text-lg md:text-xl text-foreground/80">
              India's first metro system with integrated multimodal transport. Serving Kochi with 25 stations across 27.96 km, 
              connecting people and places safely, seamlessly, and reliably.
            </p>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: "var(--kmrl-teal)" }}>25</div>
                <div className="text-sm text-muted-foreground">Stations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: "var(--kmrl-teal)" }}>27.96</div>
                <div className="text-sm text-muted-foreground">KM Length</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: "var(--kmrl-teal)" }}>82K</div>
                <div className="text-sm text-muted-foreground">Daily Ridership</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: "var(--kmrl-teal)" }}>80</div>
                <div className="text-sm text-muted-foreground">KM/H Top Speed</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <Link href="/profile">
                  <Button className="btn-primary bg-[var(--kmrl-teal)] text-white hover:opacity-90">
                    View Profile
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button className="btn-primary bg-[var(--kmrl-teal)] text-white hover:opacity-90">Get Started</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline">Log In</Button>
                  </Link>
                </>
              )}
              <Link href="/dashboard">
                <Button variant="secondary">View Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* System Overview */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">System Overview</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Kochi Metro operates Line-1 (Blue Line) from Aluva to Tripunithura, with Phase 2 (Pink Line) under construction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  Line-1 (Blue Line)
                </CardTitle>
                <CardDescription>Operational Route</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Route:</span>
                    <span className="font-medium">Aluva - Tripunithura</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Length:</span>
                    <span className="font-medium">27.96 km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stations:</span>
                    <span className="font-medium">25</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                  Line-2 (Pink Line)
                </CardTitle>
                <CardDescription>Under Construction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Route:</span>
                    <span className="font-medium">JLN Stadium - Infopark II</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Length:</span>
                    <span className="font-medium">11.2 km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stations:</span>
                    <span className="font-medium">11</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className="bg-orange-100 text-orange-800">Under Construction</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "var(--kmrl-teal)" }}></div>
                  Fleet Management
                </CardTitle>
                <CardDescription>Platform Features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Rolling Stock:</span>
                    <span className="font-medium">75 Coaches</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Train Sets:</span>
                    <span className="font-medium">25 × 3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Supplier:</span>
                    <span className="font-medium">Alstom</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depot:</span>
                    <span className="font-medium">Muttom</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced fleet optimization tools for monitoring, analysis, and decision-making.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                title: "Fleet Status", 
                desc: "Real-time monitoring of train operations, maintenance schedules, and performance metrics", 
                color: "var(--kmrl-teal)",
                icon: "🚇",
                href: "/dashboard"
              },
              { 
                title: "What-If Analysis", 
                desc: "Scenario planning and schedule optimization with predictive modeling", 
                color: "var(--kmrl-accent)",
                icon: "📊",
                href: "/digital-twin"
              },
              { 
                title: "Data Integration", 
                desc: "Seamless upload and processing of CSV, Excel, and Google Sheets data", 
                color: "var(--kmrl-success)",
                icon: "📈",
                href: "/upload"
              },
            ].map((f) => (
              <Link key={f.title} href={f.href} className="group">
                <Card className="card text-center hover:scale-105 transition-transform cursor-pointer">
                  <CardHeader>
                    <div className="text-4xl mb-2">{f.icon}</div>
                    <CardTitle style={{ color: f.color }}>
                      {f.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Quick Access</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Navigate to key sections of our platform and metro information.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard" className="group">
              <Card className="card text-center hover:scale-105 transition-transform">
                <CardContent className="pt-6">
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="font-semibold">Dashboard</h3>
                  <p className="text-sm text-muted-foreground">Fleet Overview</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/performance" className="group">
              <Card className="card text-center hover:scale-105 transition-transform">
                <CardContent className="pt-6">
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="font-semibold">Performance</h3>
                  <p className="text-sm text-muted-foreground">System Metrics</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/maintenance" className="group">
              <Card className="card text-center hover:scale-105 transition-transform">
                <CardContent className="pt-6">
                  <div className="text-2xl mb-2">🔧</div>
                  <h3 className="font-semibold">Maintenance</h3>
                  <p className="text-sm text-muted-foreground">Schedules & Alerts</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/analytics" className="group">
              <Card className="card text-center hover:scale-105 transition-transform">
                <CardContent className="pt-6">
                  <div className="text-2xl mb-2">📈</div>
                  <h3 className="font-semibold">Analytics</h3>
                  <p className="text-sm text-muted-foreground">Insights & Reports</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
