"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    localStorage.setItem("kmrl-user", JSON.stringify({ email }))
    router.push("/dashboard")
  }

  return (
    <section className="container mx-auto px-4 py-12 flex justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center" style={{ color: "var(--kmrl-teal)" }}>
            Create account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-[var(--kmrl-teal)] text-white hover:opacity-90">
              Sign up
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Have an account?{" "}
              <a href="/login" className="underline">
                Log in
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
