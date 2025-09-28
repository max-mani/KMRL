"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function ProfilePage() {
  const [email, setEmail] = useState<string>("")

  useEffect(() => {
    const u = localStorage.getItem("kmrl-user")
    if (u) setEmail(JSON.parse(u).email)
  }, [])

  if (!email) {
    return (
      <section className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-8 text-center">
            <p>Please log in to view your profile.</p>
            <a href="/login" className="underline">
              Go to login
            </a>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="container mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold" style={{ color: "var(--kmrl-teal)" }}>
        Profile
      </h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <span className="text-muted-foreground">Email:</span> {email}
          </p>
          <a href="/logout">
            <Button variant="destructive">Logout</Button>
          </a>
        </CardContent>
      </Card>
    </section>
  )
}
