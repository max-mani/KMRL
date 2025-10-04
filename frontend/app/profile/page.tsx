"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface User {
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  department?: string
  organization?: string
  role?: string
  createdAt?: string
  lastLogin?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('kmrl-token')
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch('http://localhost:3001/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setUser(data.data)
          } else {
            // Fallback to localStorage data
            const u = localStorage.getItem("kmrl-user")
            if (u) setUser(JSON.parse(u))
          }
        } else {
          // Fallback to localStorage data
          const u = localStorage.getItem("kmrl-user")
          if (u) setUser(JSON.parse(u))
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        // Fallback to localStorage data
        const u = localStorage.getItem("kmrl-user")
        if (u) setUser(JSON.parse(u))
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--kmrl-teal)] mx-auto mb-4"></div>
            <p className="text-lg">Loading profile...</p>
          </CardContent>
        </Card>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center">
            <CardTitle className="text-xl">Profile</CardTitle>
          </CardHeader>
          <CardContent className="py-8 text-center space-y-4">
            <img src="/placeholder-user.jpg" alt="User avatar" className="mx-auto rounded-full w-20 h-20 mb-4 border-2 border-[var(--kmrl-teal)]" />
            <p className="text-lg">Please log in to view your profile.</p>
            <a href="/login" className="underline">
              <Button variant="default" className="mt-2">Go to login</Button>
            </a>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="container mx-auto px-4 py-8 flex flex-col items-center min-h-[60vh]">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="flex flex-col items-center gap-2">
          <img src="/placeholder-user.jpg" alt="User avatar" className="rounded-full w-24 h-24 border-2 border-[var(--kmrl-teal)]" />
          <CardTitle className="text-2xl font-bold mt-2">{user.firstName} {user.lastName}</CardTitle>
          <span className="text-muted-foreground">{user.email}</span>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/40 rounded-lg p-4 flex flex-col items-center">
              <span className="text-muted-foreground text-sm">First Name</span>
              <span className="font-semibold text-lg">{user.firstName}</span>
            </div>
            <div className="bg-muted/40 rounded-lg p-4 flex flex-col items-center">
              <span className="text-muted-foreground text-sm">Last Name</span>
              <span className="font-semibold text-lg">{user.lastName}</span>
            </div>
            <div className="bg-muted/40 rounded-lg p-4 flex flex-col items-center md:col-span-2">
              <span className="text-muted-foreground text-sm">Email</span>
              <span className="font-semibold text-lg">{user.email}</span>
            </div>
            <div className="bg-muted/40 rounded-lg p-4 flex flex-col items-center md:col-span-2">
              <span className="text-muted-foreground text-sm">Organisation</span>
              <span className="font-semibold text-lg">{user.organization || 'Kochi Metro Rail Limited'}</span>
            </div>
            <div className="bg-muted/40 rounded-lg p-4 flex flex-col items-center">
              <span className="text-muted-foreground text-sm">Department</span>
              <span className="font-semibold text-lg">{user.department || 'Operations'}</span>
            </div>
            <div className="bg-muted/40 rounded-lg p-4 flex flex-col items-center">
              <span className="text-muted-foreground text-sm">Contact Number</span>
              <span className="font-semibold text-lg">{user.phoneNumber || 'Not provided'}</span>
            </div>
            <div className="bg-muted/40 rounded-lg p-4 flex flex-col items-center">
              <span className="text-muted-foreground text-sm">Role</span>
              <span className="font-semibold text-lg">{user.role || 'User'}</span>
            </div>
            <div className="bg-muted/40 rounded-lg p-4 flex flex-col items-center">
              <span className="text-muted-foreground text-sm">Member Since</span>
              <span className="font-semibold text-lg">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
          <div className="flex justify-center pt-4">
            <a href="/logout">
              <Button variant="destructive" size="lg">Logout</Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
