"use client"

import type React from "react"
import { useState, useEffect } from "react"
import GATracker from "@/components/ga-tracker"

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

// Mock auth guard with mounted gate to avoid SSR/CSR mismatch
function Protected({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const user = localStorage.getItem("kmrl-user")
      setIsAuthed(!!user)
    } catch {
      setIsAuthed(false)
    }
  }, [])

  // During SSR and before mount, render nothing to keep markup identical
  if (!mounted || isAuthed === null) return null

  if (!isAuthed) {
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
  const [narratives, setNarratives] = useState<Record<string, string>>({})
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('kmrl-optimization-results')
      if (raw) setResults(JSON.parse(raw))
      const rawNarr = localStorage.getItem('kmrl-optimization-narratives')
      if (rawNarr) setNarratives(JSON.parse(rawNarr))
    } catch {}
  }, [])

  useEffect(() => {
    (async () => {
      try {
        if (!results.length) return
        const missing = results.filter(r => !narratives[r.trainId])
        if (!missing.length) return
        const resp = await fetch(`${apiBase}/api/optimization/narrative/trains`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}`
          },
          body: JSON.stringify({ trains: results.map((r: any) => ({
            trainId: r.trainId,
            score: r.score,
            inductionStatus: r.inductionStatus,
            factors: {
              fitness: r.factors?.fitness?.score ?? 0,
              jobCard: r.factors?.jobCard?.score ?? 0,
              branding: r.factors?.branding?.score ?? 0,
              mileage: r.factors?.mileage?.score ?? 0,
              cleaning: r.factors?.cleaning?.score ?? 0,
              geometry: r.factors?.geometry?.score ?? 0,
            },
            ...(typeof (r as any).stablingBay !== 'undefined' ? { stablingBay: (r as any).stablingBay } : {}),
            ...(typeof (r as any).cleaningSlot !== 'undefined' ? { cleaningSlot: (r as any).cleaningSlot } : {}),
          })) })
        })
        if (resp.ok) {
          const data = await resp.json()
          const map: Record<string, string> = { ...narratives }
          ;(data.narratives || []).forEach((n: any) => { map[n.trainId] = n.narrative })
          setNarratives(map)
          try { localStorage.setItem('kmrl-optimization-narratives', JSON.stringify(map)) } catch {}
        }
      } catch {}
    })()
  }, [results])
  const getScoreTextClass = (value: number) => {
    if (value >= 65) return 'text-green-600'
    if (value >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBarClass = (value: number) => {
    if (value >= 65) return 'bg-green-500'
    if (value >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <Protected>
      <section className="container mx-auto px-4 py-8">
        <GATracker page="fleet_status" />
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
                      <p className="text-2xl font-bold text-green-700">{results.filter(r => Number(r.score) >= 65).length}</p>
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
                      <p className="text-2xl font-bold text-yellow-700">{results.filter(r => Number(r.score) >= 50 && Number(r.score) < 65).length}</p>
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
                      <p className="text-2xl font-bold text-red-700">{results.filter(r => Number(r.score) < 50).length}</p>
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
                      { status: 'Running', count: results.filter(r => Number(r.score) >= 65).length },
                      { status: 'Standby', count: results.filter(r => Number(r.score) >= 50 && Number(r.score) < 65).length },
                      { status: 'Maintenance', count: results.filter(r => Number(r.score) < 50).length },
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
              {/* Six-Factor Analysis (right side) */}
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

            {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Train Rankings (0-100 Scale)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {results
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((train, index) => (
                  <div key={train.trainId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <p className="font-semibold">{train.trainId}</p>
                        {narratives[train.trainId] && (
                          <p className="text-sm text-muted-foreground">{narratives[train.trainId]}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getScoreTextClass(train.score)}`}>{train.score}</p>
                      <Progress 
                        value={train.score} 
                        className="w-24 h-2" 
                        indicatorClassName={getBarClass(train.score)}
                        trackClassName="bg-muted" 
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            )}
          </div>
        </div>
      </section>
    </Protected>
  )
}
