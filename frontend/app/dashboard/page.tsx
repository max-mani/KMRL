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

// derive from uploaded optimization results
type Result = {
  trainId: string
  score: number
  factors?: Record<string, { score: number; status: string }>
  inductionStatus?: string
  cleaningSlot?: number
  stablingBay?: number
  reason?: string
}

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
  const [results, setResults] = useState<Result[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('kmrl-optimization-results')
      if (raw) setResults(JSON.parse(raw))
    } catch {}
  }, [])

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
          {!results.length && (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-yellow-600" />
                <p className="mb-2">No data found. Please upload data to view Fleet Status.</p>
                <a href="/upload" className="underline" style={{ color: "var(--kmrl-teal)" }}>Go to Upload</a>
              </CardContent>
            </Card>
          )}
          <div className="space-y-6">
            {/* Fleet Status Overview */}
            {results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Running</p>
                      <p className="text-2xl font-bold text-green-700">{results.filter(r => (r.inductionStatus || '').toLowerCase() === 'revenue').length}</p>
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
                      <p className="text-2xl font-bold text-yellow-700">{results.filter(r => (r.inductionStatus || '').toLowerCase() === 'standby').length}</p>
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
                      <p className="text-2xl font-bold text-red-700">{results.filter(r => (r.inductionStatus || '').toLowerCase() === 'maintenance').length}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Fleet Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { status: 'Running', count: results.filter(r => (r.inductionStatus || '').toLowerCase() === 'revenue').length },
                      { status: 'Standby', count: results.filter(r => (r.inductionStatus || '').toLowerCase() === 'standby').length },
                      { status: 'Maintenance', count: results.filter(r => (r.inductionStatus || '').toLowerCase() === 'maintenance').length },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--kmrl-teal)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              )}

              {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Train Rankings (0-100 Scale)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results
                    .slice()
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5)
                    .map((train, index) => (
                    <div key={train.trainId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <p className="font-semibold">{train.trainId}</p>
                          <p className="text-sm text-muted-foreground">{train.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: "var(--kmrl-teal)" }}>{train.score}</p>
                        <Progress value={train.score} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              )}
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
