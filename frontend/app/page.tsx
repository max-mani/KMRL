"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <section className="relative">
      <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <img
              src="/Koch_Metro_Logo.png"
              alt="Kochi Metro Rail Limited Logo"
              className="h-14 w-auto"
            />
            <div className="text-left">
              <p className="text-sm text-muted-foreground">KMRL</p>
              <h1 className="text-balance text-2xl md:text-3xl font-semibold" style={{ color: "var(--kmrl-teal)" }}>
                Fleet Optimization Platform
              </h1>
            </div>
          </div>

          {/* Hero */}
          <p className="max-w-2xl text-pretty text-base md:text-lg text-foreground/80">
            Plan, monitor, and optimize daily fleet induction with data-driven insights. Visualize System Performance,
            Maintenance, and Critical Issues—across devices with dark mode support.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button className="bg-[var(--kmrl-teal)] text-white hover:opacity-90">Get Started</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">View Dashboard</Button>
            </Link>
          </div>

          {/* Feature bullets */}
          <ul className="grid w-full max-w-4xl grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { title: "Fleet Status", desc: "Running, Standby, Maintenance", color: "var(--kmrl-teal)" },
              { title: "What-If", desc: "Scenario analysis & schedule", color: "var(--kmrl-accent)" },
              { title: "Upload Data", desc: "CSV / Excel / GSheet preview", color: "var(--kmrl-success)" },
            ].map((f) => (
              <li key={f.title} className="rounded-lg border bg-card p-4 text-left">
                <h3 className="font-semibold" style={{ color: f.color }}>
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
