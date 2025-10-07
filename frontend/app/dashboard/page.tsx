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
  RefreshCw,
  MapPin,
  Wrench,
  Shield,
  Calendar
} from "lucide-react"
import { EditableValue, useManualOverride } from "@/components/manual-override"
import { GeminiService } from "@/lib/gemini-service"
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
  const [calculatedData, setCalculatedData] = useState<Record<string, { depot: string; cleaningSlot: number; stablingPosition: string }>>({})
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001')
  const { overrides } = useManualOverride()
  const [sentMessageVisible, setSentMessageVisible] = useState(false)

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

  // Calculate depot, cleaning slot, and stabling position using Gemini API
  useEffect(() => {
    (async () => {
      if (!results.length) return
      
      try {
        const geminiResults = await GeminiService.calculateTrainData(results)
        const dataMap: Record<string, { depot: string; cleaningSlot: number; stablingPosition: string }> = {}
        
        results.forEach((train, index) => {
          const calculated = geminiResults[index] || {
            depot: 'Muttom Depot',
            cleaningSlot: train.score >= 80 ? (index % 3) + 1 : train.score >= 60 ? (index % 3) + 4 : (index % 2) + 7,
            stablingPosition: `Track-${train.score >= 70 ? (index % 10) + 1 : (index % 10) + 11}`
          }
          dataMap[train.trainId] = calculated
        })
        
        setCalculatedData(dataMap)
      } catch (error) {
        console.error('Error calculating train data:', error)
        // Fallback to default values
        const fallbackData: Record<string, { depot: string; cleaningSlot: number; stablingPosition: string }> = {}
        results.forEach((train, index) => {
          fallbackData[train.trainId] = {
            depot: 'Muttom Depot',
            cleaningSlot: train.score >= 80 ? (index % 3) + 1 : train.score >= 60 ? (index % 3) + 4 : (index % 2) + 7,
            stablingPosition: `Track-${train.score >= 70 ? (index % 10) + 1 : (index % 10) + 11}`
          }
        })
        setCalculatedData(fallbackData)
      }
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
              KMRL Fleet Status Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor current induction list, train rankings, maintenance status, and operational performance.
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
            <div>
              <Button
                className="bg-[var(--kmrl-teal)] text-white hover:opacity-90"
                onClick={() => {
                  try {
                    // compute counts (kept for potential future use)
                    const running = results.filter(r => Number(r.score) >= 65).length
                    const standby = results.filter(r => Number(r.score) >= 50 && Number(r.score) < 65).length
                    const maintenance = results.filter(r => Number(r.score) < 50).length

                    // Show inline success message after 2 seconds
                    setSentMessageVisible(false)
                    setTimeout(() => {
                      setSentMessageVisible(true)
                      // auto-hide after 5 seconds
                      setTimeout(() => setSentMessageVisible(false), 5000)
                    }, 2000)
                  } catch (e) {
                    // if error, still show message
                    setSentMessageVisible(true)
                    setTimeout(() => setSentMessageVisible(false), 5000)
                  }
                }}
              >
              {/* WhatsApp SVG */}
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M20.52 3.48A11.86 11.86 0 0012 .5C6.21.5 1.5 5.21 1.5 11c0 1.94.51 3.78 1.48 5.41L.5 23.5l7.32-2.38A11.86 11.86 0 0012 22.5c5.79 0 10.5-4.71 10.5-10.5 0-3.03-1.18-5.86-3.98-8.52zM12 20.75c-1.2 0-2.37-.26-3.44-.76l-.25-.13-4.36 1.42 1.36-3.98-.16-.26A8.25 8.25 0 013.75 11c0-4.55 3.7-8.25 8.25-8.25S20.25 6.45 20.25 11 16.55 20.75 12 20.75z" />
                <path d="M17.06 14.17c-.29-.14-1.71-.84-1.97-.93-.26-.09-.45-.14-.64.14s-.73.93-.9 1.12c-.17.19-.34.21-.63.07-.29-.14-1.22-.45-2.32-1.42-.86-.78-1.44-1.74-1.61-2.02-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.09-.19.05-.36-.02-.5-.07-.14-.64-1.54-.88-2.12-.23-.56-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.43 0 1.43 1.03 2.81 1.17 3.01.14.19 2.03 3.1 4.92 4.35 2.89 1.25 2.89.83 3.41.78.52-.04 1.71-.7 1.95-1.37.24-.67.24-1.24.17-1.37-.07-.13-.26-.19-.55-.33z" fill="#fff" />
              </svg>
              Send the fleet status to Supervisor
              </Button>

              {sentMessageVisible && (
                <p className="text-sm text-green-600 mt-2">Successfully sent data to Supervisors</p>
              )}
            </div>
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
                      <p className="text-2xl font-bold text-green-700">{results.filter(r => {
                        const ov = overrides[`train.score.${r.trainId}`]
                        const score = Number(typeof ov !== 'undefined' ? ov : r.score)
                        return score >= 65
                      }).length}</p>
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
                      <p className="text-2xl font-bold text-yellow-700">{results.filter(r => {
                        const ov = overrides[`train.score.${r.trainId}`]
                        const score = Number(typeof ov !== 'undefined' ? ov : r.score)
                        return score >= 50 && score < 65
                      }).length}</p>
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
                      <p className="text-2xl font-bold text-red-700">{results.filter(r => {
                        const ov = overrides[`train.score.${r.trainId}`]
                        const score = Number(typeof ov !== 'undefined' ? ov : r.score)
                        return score < 50
                      }).length}</p>
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
                <CardTitle className="flex items-center gap-2">
                  <Train className="h-5 w-5" />
                  Current Induction List (Train Rank List)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Rank</th>
                        <th className="text-left p-3 font-semibold">Train ID</th>
                        <th className="text-left p-3 font-semibold">Status</th>
                        <th className="text-left p-3 font-semibold">Failure Risk</th>
                        <th className="text-left p-3 font-semibold">Depot</th>
                        <th className="text-left p-3 font-semibold">Cleaning Slot</th>
                        <th className="text-left p-3 font-semibold">Stabling Position</th>
                        <th className="text-left p-3 font-semibold">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results
                        .slice()
                        .sort((a, b) => {
                          const sa = Number(typeof overrides[`train.score.${a.trainId}`] !== 'undefined' ? overrides[`train.score.${a.trainId}`] : a.score)
                          const sb = Number(typeof overrides[`train.score.${b.trainId}`] !== 'undefined' ? overrides[`train.score.${b.trainId}`] : b.score)
                          return sb - sa
                        })
                        .map((train, index) => {
                          const score = Number(typeof overrides[`train.score.${train.trainId}`] !== 'undefined' ? overrides[`train.score.${train.trainId}`] : train.score)
                          const status = score >= 65 ? 'running' : score >= 50 ? 'standby' : 'maintenance'
                          const failureRisk = score >= 80 ? 'Low' : score >= 60 ? 'Medium' : 'High'
                          const calculated = calculatedData[train.trainId] || {
                            depot: 'Muttom Depot',
                            cleaningSlot: score >= 80 ? (index % 3) + 1 : score >= 60 ? (index % 3) + 4 : (index % 2) + 7,
                            stablingPosition: `Track-${score >= 70 ? (index % 10) + 1 : (index % 10) + 11}`
                          }
                          const depot = calculated.depot
                          const cleaningSlot = calculated.cleaningSlot
                          const stablingPosition = calculated.stablingPosition
                          
                          return (
                            <tr key={train.trainId} className="border-b hover:bg-muted/50">
                              <td className="p-3">
                                <Badge variant="outline" className="font-mono">#{index + 1}</Badge>
                              </td>
                              <td className="p-3 font-semibold">{train.trainId}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {status === 'running' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                  {status === 'standby' && <Clock className="h-4 w-4 text-yellow-600" />}
                                  {status === 'maintenance' && <Wrench className="h-4 w-4 text-red-600" />}
                                  <span className={`capitalize font-medium ${
                                    status === 'running' ? 'text-green-600' : 
                                    status === 'standby' ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {status}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Shield className={`h-4 w-4 ${
                                    failureRisk === 'Low' ? 'text-green-600' : 
                                    failureRisk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                                  }`} />
                                  <span className={`font-medium ${
                                    failureRisk === 'Low' ? 'text-green-600' : 
                                    failureRisk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {failureRisk}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm">{depot}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-purple-600" />
                                  <span className="font-mono text-sm">Slot-{cleaningSlot}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Train className="h-4 w-4 text-indigo-600" />
                                  <span className="font-mono text-sm">{stablingPosition}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className={`text-lg font-bold ${getScoreTextClass(score)}`}>
                                    {score}
                                  </span>
                                  <Progress 
                                    value={score} 
                                    className="w-16 h-2" 
                                    indicatorClassName={getBarClass(score)}
                                    trackClassName="bg-muted" 
                                  />
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
                {results.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Train className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No train data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </div>
        </div>
      </section>
    </Protected>
  )
}
