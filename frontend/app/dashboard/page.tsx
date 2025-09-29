"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrainDetail } from "@/components/train-detail"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Train, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Upload,
  Download,
  RefreshCw
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

// Mock auth guard
function Protected({ children }: { children: React.ReactNode }) {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("kmrl-user")
    if (!user) {
      return (
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="mb-2">You must be logged in to view the dashboard.</p>
              <a href="/login" className="underline" style={{ color: "var(--kmrl-teal)" }}>
                Go to Login
              </a>
            </CardContent>
          </Card>
        </div>
      )
    }
  }
  return <>{children}</>
}

// Enhanced mock data with six-factor analysis
const fleetData = [
  { status: "Running", count: 18, color: "#10B981" },
  { status: "Standby", count: 6, color: "#F59E0B" },
  { status: "Maintenance", count: 4, color: "#EF4444" },
]

const kpiData = [
  { day: "Mon", mileage: 420, energy: 92, punctuality: 98.5, branding: 85 },
  { day: "Tue", mileage: 480, energy: 88, punctuality: 99.2, branding: 78 },
  { day: "Wed", mileage: 455, energy: 95, punctuality: 99.8, branding: 92 },
  { day: "Thu", mileage: 500, energy: 90, punctuality: 98.9, branding: 88 },
  { day: "Fri", mileage: 530, energy: 87, punctuality: 99.1, branding: 85 },
]

// Mock train data with six-factor scoring
const trainData = [
  { 
    id: "T001", 
    name: "Train 001", 
    status: "running", 
    score: 85,
    factors: {
      fitness: { score: 95, status: "great" },
      jobCard: { score: 80, status: "good" },
      branding: { score: 65, status: "ok" },
      mileage: { score: 90, status: "great" },
      cleaning: { score: 75, status: "good" },
      geometry: { score: 70, status: "ok" }
    },
    reason: "Excellent fitness certificate and mileage balancing, but branding wrap is overdue"
  },
  { 
    id: "T002", 
    name: "Train 002", 
    status: "standby", 
    score: 72,
    factors: {
      fitness: { score: 85, status: "good" },
      jobCard: { score: 70, status: "ok" },
      branding: { score: 45, status: "bad" },
      mileage: { score: 80, status: "good" },
      cleaning: { score: 65, status: "ok" },
      geometry: { score: 75, status: "good" }
    },
    reason: "Good overall condition but branding wrap is critical and needs immediate attention"
  },
  { 
    id: "T003", 
    name: "Train 003", 
    status: "maintenance", 
    score: 45,
    factors: {
      fitness: { score: 30, status: "bad" },
      jobCard: { score: 40, status: "bad" },
      branding: { score: 60, status: "ok" },
      mileage: { score: 50, status: "ok" },
      cleaning: { score: 35, status: "bad" },
      geometry: { score: 55, status: "ok" }
    },
    reason: "Multiple critical issues: fitness certificate expired, job card overdue, cleaning required"
  },
  { 
    id: "T004", 
    name: "Train 004", 
    status: "running", 
    score: 92,
    factors: {
      fitness: { score: 98, status: "great" },
      jobCard: { score: 95, status: "great" },
      branding: { score: 90, status: "great" },
      mileage: { score: 88, status: "good" },
      cleaning: { score: 95, status: "great" },
      geometry: { score: 90, status: "great" }
    },
    reason: "Excellent condition across all factors - optimal for revenue service"
  },
  { 
    id: "T005", 
    name: "Train 005", 
    status: "standby", 
    score: 68,
    factors: {
      fitness: { score: 70, status: "ok" },
      jobCard: { score: 75, status: "good" },
      branding: { score: 80, status: "good" },
      mileage: { score: 60, status: "ok" },
      cleaning: { score: 65, status: "ok" },
      geometry: { score: 70, status: "ok" }
    },
    reason: "Average condition across all factors - suitable for standby duty"
  }
]

const factorColors = {
  great: "bg-green-500",
  good: "bg-blue-500", 
  ok: "bg-yellow-500",
  bad: "bg-red-500"
}

const factorLabels = {
  fitness: "Fitness Certificate",
  jobCard: "Job Card Status", 
  branding: "Branding Priority",
  mileage: "Mileage Balancing",
  cleaning: "Cleaning & Detailing",
  geometry: "Stabling Geometry"
}

export default function DashboardPage() {
  const [selectedTrain, setSelectedTrain] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <Protected>
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-balance" style={{ color: "var(--kmrl-teal)" }}>
              KMRL Fleet Optimization Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor Fleet Status, Maintenance, Performance, Critical Insights, and Historical Data.
          </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-6">
            {/* Fleet Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Running</p>
                      <p className="text-2xl font-bold text-green-700">18</p>
                    </div>
                    <Train className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Standby</p>
                      <p className="text-2xl font-bold text-yellow-700">6</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Maintenance</p>
                      <p className="text-2xl font-bold text-red-700">4</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fleet Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fleetData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--kmrl-teal)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Train Rankings (0-100 Scale)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trainData.slice(0, 5).map((train, index) => (
                    <div key={train.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <p className="font-semibold">{train.name}</p>
                          <p className="text-sm text-muted-foreground">{train.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: "var(--kmrl-teal)" }}>
                          {train.score}
                        </p>
                        <Progress value={train.score} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Six-Factor Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Six-Factor Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(factorLabels).map(([key, label]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-3">{label}</h4>
                      <div className="space-y-2">
                        {Object.entries(factorColors).map(([status, color]) => (
                          <div key={status} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${color}`}></div>
                            <span className="text-sm capitalize">{status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Protected>
  )
}
