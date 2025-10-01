"use client"

import type React from "react"
import { useState, useEffect } from "react"
import GATracker from "@/components/ga-tracker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Train, 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  TrendingUp,
  TrendingDown
} from "lucide-react"

// Mock auth guard
function Protected({ children }: { children: React.ReactNode }) {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("kmrl-user")
    if (!user) {
      return (
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="mb-2">You must be logged in to view the what-if analysis.</p>
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

// Trains will be loaded from uploaded results
const loadTrainsFromResults = () => {
  try {
    const raw = localStorage.getItem('kmrl-optimization-results')
    const results: any[] = raw ? JSON.parse(raw) : []
    return results.map((r, i) => ({
      id: r.trainId || `T${String(i + 1).padStart(3, '0')}`,
      name: r.trainId || `Train ${String(i + 1).padStart(3, '0')}`,
      status: (r.inductionStatus || 'standby').toLowerCase(),
      score: Number(r.score) || 0,
      factors: r.factors || { fitness: 'ok', jobCard: 'ok', branding: 'ok', mileage: 'ok', cleaning: 'ok', geometry: 'ok' }
    }))
  } catch {
    return [] as any[]
  }
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

export default function WhatIfPage() {
  const [hasUser, setHasUser] = useState<boolean>(false)
  const [hasResults, setHasResults] = useState<boolean>(true)
  const [trains, setTrains] = useState(loadTrainsFromResults())
  const [selectedTrain, setSelectedTrain] = useState<string>("")
  const [scenario, setScenario] = useState<string>("")
  const [isAnimating, setIsAnimating] = useState(false)
  const [simulationResult, setSimulationResult] = useState<any>(null)
  const [desiredRunning, setDesiredRunning] = useState<number>(0)
  const [desiredStandby, setDesiredStandby] = useState<number>(0)
  const [desiredMaintenance, setDesiredMaintenance] = useState<number>(0)

  useEffect(() => {
    try {
      const user = localStorage.getItem('kmrl-user')
      setHasUser(!!user)
      const results = localStorage.getItem('kmrl-optimization-results')
      setHasResults(!!results)
    } catch {}
  }, [])

  const handleScenarioChange = (trainId: string, newStatus: string) => {
    setTrains(prev => prev.map(train => 
      train.id === trainId ? { ...train, status: newStatus } : train
    ))
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 2000)
  }

  const runSimulation = () => {
    const runningCount = trains.filter(t => t.status === "running").length
    const standbyCount = trains.filter(t => t.status === "standby").length
    const maintenanceCount = trains.filter(t => t.status === "maintenance").length
    const avgScore = trains.reduce((sum, t) => sum + t.score, 0) / trains.length

    setSimulationResult({
      runningCount,
      standbyCount, 
      maintenanceCount,
      avgScore,
      recommendations: [
        runningCount < 20 ? "Consider moving more trains to running status" : "Fleet utilization is optimal",
        maintenanceCount > 5 ? "High maintenance load - consider scheduling" : "Maintenance load is manageable",
        avgScore > 80 ? "Excellent fleet performance" : "Fleet performance needs improvement"
      ]
    })
  }

  const resetSimulation = () => {
    setTrains(mockTrains)
    setSimulationResult(null)
    setIsAnimating(false)
  }

  // Initialize desired counts from current distribution
  useEffect(() => {
    const runningCount = trains.filter(t => t.status === "running").length
    const standbyCount = trains.filter(t => t.status === "standby").length
    const maintenanceCount = trains.filter(t => t.status === "maintenance").length
    setDesiredRunning(runningCount)
    setDesiredStandby(standbyCount)
    setDesiredMaintenance(maintenanceCount)
  }, [])

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

  const applyDesiredCounts = () => {
    const total = trains.length
    const targetRunning = clamp(Math.floor(desiredRunning), 0, total)
    const targetStandby = clamp(Math.floor(desiredStandby), 0, total - targetRunning)
    const targetMaintenance = clamp(total - targetRunning - targetStandby, 0, total)

    // Sort trains by score, prefer high score to running, mid to standby, low to maintenance
    const sorted = [...trains].sort((a, b) => b.score - a.score)
    const next: typeof trains = []
    let r = 0, s = 0, m = 0
    for (const t of sorted) {
      if (r < targetRunning) {
        next.push({ ...t, status: "running" })
        r++
      } else if (s < targetStandby) {
        next.push({ ...t, status: "standby" })
        s++
      } else if (m < targetMaintenance) {
        next.push({ ...t, status: "maintenance" })
        m++
      } else {
        next.push({ ...t, status: "standby" })
      }
    }

    setIsAnimating(true)
    setTrains(next)
    setTimeout(() => setIsAnimating(false), 1200)
  }

  if (!hasUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="mb-2">You must be logged in to view What-If Analysis.</p>
            <a href="/login" className="underline" style={{ color: "var(--kmrl-teal)" }}>Go to Login</a>
          </div>
        </div>
      </div>
    )
  }

  if (!hasResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="mb-2">No data found. Please upload data to continue.</p>
            <a href="/upload" className="underline" style={{ color: "var(--kmrl-teal)" }}>Go to Upload</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Protected>
      <section className="container mx-auto px-4 py-8 overflow-x-hidden">
        <GATracker page="what_if" />
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-balance" style={{ color: "var(--kmrl-teal)" }}>
            What-If Analysis
          </h1>
          <p className="text-sm text-muted-foreground">
            Simulate different train induction scenarios and analyze their impact on fleet performance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Train Selection & Controls */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Train className="h-5 w-5" />
                Scenario Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Count controls */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="mb-1 block">Running</Label>
                  <Input
                    type="number"
                    min={0}
                    max={trains.length}
                    value={desiredRunning}
                    onChange={(e) => setDesiredRunning(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="mb-1 block">Standby</Label>
                  <Input
                    type="number"
                    min={0}
                    max={trains.length}
                    value={desiredStandby}
                    onChange={(e) => setDesiredStandby(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="mb-1 block">Maintenance</Label>
                  <Input
                    type="number"
                    min={0}
                    max={trains.length}
                    value={desiredMaintenance}
                    onChange={(e) => setDesiredMaintenance(Number(e.target.value))}
                  />
                </div>
              </div>
              <Button className="w-full" onClick={applyDesiredCounts}>
                Apply Counts
              </Button>
              <div>
                <Label htmlFor="train-select">Select Train</Label>
                <Select value={selectedTrain} onValueChange={setSelectedTrain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a train" />
                  </SelectTrigger>
                  <SelectContent>
                    {trains.map(train => (
                      <SelectItem key={train.id} value={train.id}>
                        {train.name} (Score: {train.score})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTrain && (
                <div>
                  <Label htmlFor="scenario-select">Change Status To</Label>
                  <Select value={scenario} onValueChange={setScenario}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="standby">Standby</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={() => selectedTrain && scenario && handleScenarioChange(selectedTrain, scenario)}
                  disabled={!selectedTrain || !scenario}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Apply Change
                </Button>
                <Button variant="outline" onClick={resetSimulation}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <Button onClick={runSimulation} className="w-full" style={{ backgroundColor: "var(--kmrl-teal)" }}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Run Simulation
              </Button>
            </CardContent>
          </Card>

          {/* Train Flow Visualization */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Train Flow Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="h-16 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                    <Train className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-700">Running</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {trains.filter(t => t.status === "running").length}
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-16 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-yellow-700">Standby</h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {trains.filter(t => t.status === "standby").length}
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-16 bg-red-100 rounded-lg flex items-center justify-center mb-2">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-red-700">Maintenance</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {trains.filter(t => t.status === "maintenance").length}
                  </p>
                </div>
              </div>

              {/* Train Cards with Animation */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-stretch w-full">
                {trains.map(train => (
                  <div 
                    key={train.id}
                    className={`p-3 rounded-lg border-2 transition-all duration-1000 h-full ${
                      train.status === "running" ? "border-green-500 bg-green-50" :
                      train.status === "standby" ? "border-yellow-500 bg-yellow-50" :
                      "border-red-500 bg-red-50"
                    } ${isAnimating ? "animate-pulse" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{train.name}</span>
                      <Badge className={
                        train.score >= 80 ? 'bg-green-100 text-green-800' :
                        train.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }>
                        {train.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Score: {train.score}/100
                    </div>
                    <Progress 
                      value={train.score} 
                      className="mt-2 h-2"
                      indicatorClassName={train.score >= 80 ? 'bg-green-500' : train.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}
                      trackClassName="bg-muted"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Simulation Results */}
        {simulationResult && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Simulation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-700">Running Trains</h3>
                  <p className="text-3xl font-bold text-green-600">{simulationResult.runningCount}</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-700">Standby Trains</h3>
                  <p className="text-3xl font-bold text-yellow-600">{simulationResult.standbyCount}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <h3 className="font-semibold text-red-700">Maintenance</h3>
                  <p className="text-3xl font-bold text-red-600">{simulationResult.maintenanceCount}</p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Average Fleet Score: {simulationResult.avgScore.toFixed(1)}/100</h3>
                <Progress value={simulationResult.avgScore} className="h-3" />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Recommendations</h3>
                <div className="space-y-2">
                  {simulationResult.recommendations.map((rec: string, index: number) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Six-Factor Analysis */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Six-Factor Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Factor Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(factorLabels).map(([key, label]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">{label}</h4>
                      <div className="space-y-1">
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
              </TabsContent>
              
              <TabsContent value="details" className="mt-4">
                <div className="space-y-4">
                  {trains.map(train => (
                    <div key={train.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{train.name}</h4>
                        <Badge variant="outline">Score: {train.score}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(train.factors).map(([factor, status]) => (
                          <div key={factor} className="text-center">
                            <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${factorColors[status as keyof typeof factorColors]}`}></div>
                            <span className="text-xs">{factorLabels[factor as keyof typeof factorLabels]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </Protected>
  )
}
