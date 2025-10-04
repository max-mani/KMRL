"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Zap, 
  Target, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Train
} from "lucide-react"

interface TrainPosition {
  id: string
  name: string
  x: number
  y: number
  zone: 'service' | 'standby' | 'ibl' | 'cleaning'
  bay: string
  score: number
  status: 'moving' | 'stationary' | 'loading'
  targetX?: number
  targetY?: number
  targetZone?: string
  movingSpeed?: number
}

interface Scenario {
  id: string
  name: string
  description: string
  parameters: {
    serviceDemand: string
    energyEfficiency: string
    maintenancePriority: string
    brandingPriority: string
  }
}

interface OptimizationResult {
  assignments: Array<{
    trainId: string
    assignedZone: string
    bay: string
    position: { x: number; y: number }
    score: number
    reasoning: string
  }>
  metrics: {
    totalTrains: number
    serviceTrains: number
    standbyTrains: number
    maintenanceTrains: number
    averageScore: number
    energyEfficiency: number
    shuntingCost: number
    brandingCompliance: number
    punctuality: number
  }
  narrative: {
    summary: string
    keyChanges: string[]
    recommendations: string[]
    warnings: string[]
  }
}

export default function DigitalTwinPage() {
  const [hasUser, setHasUser] = useState<boolean>(false)
  const [hasResults, setHasResults] = useState<boolean>(true)
  const [trains, setTrains] = useState<TrainPosition[]>([])
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<string>('')
  const [isSimulating, setIsSimulating] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationSpeed, setAnimationSpeed] = useState(1)
  const [desiredService, setDesiredService] = useState<number>(0)
  const [desiredStandby, setDesiredStandby] = useState<number>(0)
  const [desiredMaintenance, setDesiredMaintenance] = useState<number>(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()

  // Zone definitions with positions
  const zones = {
    service: { x: 100, y: 50, width: 800, height: 100, color: '#10b981', capacity: 18 },
    standby: { x: 100, y: 200, width: 600, height: 100, color: '#f59e0b', capacity: 6 },
    ibl: { x: 100, y: 350, width: 400, height: 100, color: '#ef4444', capacity: 4 },
    cleaning: { x: 600, y: 350, width: 300, height: 100, color: '#8b5cf6', capacity: 3 }
  }

  useEffect(() => {
    try {
      const user = localStorage.getItem('kmrl-user')
      setHasUser(!!user)
      const results = localStorage.getItem('kmrl-optimization-results')
      setHasResults(!!results)
    } catch {}
    initializeTrains()
    loadScenarios()
  }, [])

  useEffect(() => {
    if (isAnimating) {
      animateTrains()
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isAnimating, trains])

  const initializeTrains = () => {
    try {
      const raw = localStorage.getItem('kmrl-optimization-results')
      const results: any[] = raw ? JSON.parse(raw) : []
      const mapped: TrainPosition[] = results.map((r, i) => {
        const status = (r.inductionStatus || '').toLowerCase()
        const zone = status === 'revenue' ? 'service' : status === 'standby' ? 'standby' : 'ibl'
        const base = zones[zone as keyof typeof zones]
        return {
          id: r.trainId || `T${i + 1}`,
          name: r.trainId || `Train ${i + 1}`,
          x: base.x + ((i * 80) % Math.max(80, base.width - 80)) + 40,
          y: base.y + (Math.floor(i / 9) * 50 + 25),
          zone: zone as any,
          bay: `${zone.toUpperCase().slice(0,2)}${i + 1}`,
          score: Number(r.score) || 0,
          status: 'stationary'
        }
      })
      setTrains(mapped)
      // seed desired counts
      const s = mapped.filter(t => t.zone === 'service').length
      const st = mapped.filter(t => t.zone === 'standby').length
      const m = mapped.filter(t => t.zone === 'ibl').length
      setDesiredService(s)
      setDesiredStandby(st)
      setDesiredMaintenance(m)
    } catch {
      setTrains([])
    }
  }

  const loadScenarios = () => {
    const mockScenarios: Scenario[] = [
      {
        id: 'peak-hour-optimization',
        name: 'Peak Hour Optimization',
        description: 'Optimize fleet for morning peak hours (7-9 AM) with high service demand',
        parameters: {
          serviceDemand: 'high',
          energyEfficiency: 'medium',
          maintenancePriority: 'low',
          brandingPriority: 'high'
        }
      },
      {
        id: 'maintenance-window',
        name: 'Maintenance Window',
        description: 'Schedule maintenance during off-peak hours with focus on reliability',
        parameters: {
          serviceDemand: 'low',
          energyEfficiency: 'high',
          maintenancePriority: 'high',
          brandingPriority: 'medium'
        }
      },
      {
        id: 'energy-optimization',
        name: 'Energy Optimization',
        description: 'Minimize energy consumption and shunting costs',
        parameters: {
          serviceDemand: 'medium',
          energyEfficiency: 'high',
          maintenancePriority: 'medium',
          brandingPriority: 'low'
        }
      },
      {
        id: 'branding-compliance',
        name: 'Branding Compliance',
        description: 'Maximize branding exposure and SLA compliance',
        parameters: {
          serviceDemand: 'medium',
          energyEfficiency: 'medium',
          maintenancePriority: 'low',
          brandingPriority: 'high'
        }
      }
    ]
    setScenarios(mockScenarios)
  }

  const animateTrains = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw zones
      Object.entries(zones).forEach(([zoneName, zone]) => {
        ctx.fillStyle = zone.color + '20' // Add transparency
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height)
        ctx.strokeStyle = zone.color
        ctx.lineWidth = 2
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height)
        
        // Zone labels
        ctx.fillStyle = '#333'
        ctx.font = '14px Arial'
        ctx.fillText(zoneName.toUpperCase(), zone.x + 10, zone.y + 20)
        ctx.fillText(`Capacity: ${zone.capacity}`, zone.x + 10, zone.y + 35)
      })
      
      // Draw trains
      trains.forEach(train => {
        // Train body
        ctx.fillStyle = getTrainColor(train.zone, train.score)
        ctx.fillRect(train.x - 15, train.y - 10, 30, 20)
        
        // Train outline
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 1
        ctx.strokeRect(train.x - 15, train.y - 10, 30, 20)
        
        // Train ID
        ctx.fillStyle = '#fff'
        ctx.font = '10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(train.id, train.x, train.y + 3)
        
        // Score indicator
        ctx.fillStyle = train.score >= 80 ? '#10b981' : train.score >= 60 ? '#f59e0b' : '#ef4444'
        ctx.fillRect(train.x - 12, train.y - 15, 24, 3)
        
        // Movement indicator
        if (train.status === 'moving') {
          ctx.fillStyle = '#3b82f6'
          ctx.beginPath()
          ctx.arc(train.x, train.y, 5, 0, 2 * Math.PI)
          ctx.fill()
        }
      })
      
      if (isAnimating) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }
    
    animate()
  }

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

  const applyCountsAndAnimate = () => {
    const total = trains.length
    const targetService = clamp(Math.floor(desiredService), 0, total)
    const targetStandby = clamp(Math.floor(desiredStandby), 0, total - targetService)
    const targetMaintenance = clamp(total - targetService - targetStandby, 0, total)

    const sorted = [...trains].sort((a, b) => b.score - a.score)
    const next: TrainPosition[] = []
    let s = 0, st = 0, m = 0
    for (const t of sorted) {
      let targetZone: 'service' | 'standby' | 'ibl' = 'standby'
      if (s < targetService) { targetZone = 'service'; s++ }
      else if (st < targetStandby) { targetZone = 'standby'; st++ }
      else if (m < targetMaintenance) { targetZone = 'ibl'; m++ }

      const base = zones[targetZone]
      const idx = next.length
      const targetX = base.x + ((idx * 80) % Math.max(80, base.width - 80)) + 40
      const targetY = base.y + (Math.floor(idx / 9) * 50 + 25)

      next.push({
        ...t,
        targetX,
        targetY,
        targetZone,
        status: 'moving',
        movingSpeed: animationSpeed
      })
    }

    setIsAnimating(true)
    setTrains(next)
    setTimeout(() => {
      setIsAnimating(false)
      setTrains(prev => prev.map(tr => ({
        ...tr,
        x: tr.targetX ?? tr.x,
        y: tr.targetY ?? tr.y,
        zone: (tr.targetZone as any) ?? tr.zone,
        status: 'stationary'
      })))
    }, 1500 / Math.max(0.25, animationSpeed))
  }

  const getTrainColor = (zone: string, score: number) => {
    if (score >= 80) return '#10b981' // Green
    if (score >= 60) return '#f59e0b' // Yellow
    return '#ef4444' // Red
  }

  const runOptimization = async () => {
    setIsSimulating(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock optimization result
    const result: OptimizationResult = {
      assignments: trains.map(train => ({
        trainId: train.id,
        assignedZone: getOptimizedZone(train.score),
        bay: `BAY${Math.floor(Math.random() * 10) + 1}`,
        position: { x: Math.random() * 800 + 100, y: Math.random() * 400 + 50 },
        score: train.score,
        reasoning: `Score ${train.score} - ${train.score >= 80 ? 'optimal for service' : train.score >= 60 ? 'suitable for standby' : 'requires maintenance'}`
      })),
      metrics: {
        totalTrains: trains.length,
        serviceTrains: trains.filter(t => t.score >= 80).length,
        standbyTrains: trains.filter(t => t.score >= 60 && t.score < 80).length,
        maintenanceTrains: trains.filter(t => t.score < 60).length,
        averageScore: Math.round(trains.reduce((sum, t) => sum + t.score, 0) / trains.length),
        energyEfficiency: Math.floor(Math.random() * 20) + 80,
        shuntingCost: Math.floor(Math.random() * 100) + 100,
        brandingCompliance: Math.floor(Math.random() * 15) + 85,
        punctuality: Math.floor(Math.random() * 2) + 98
      },
      narrative: {
        summary: `Optimization completed: ${trains.length} trains assigned with average score of ${Math.round(trains.reduce((sum, t) => sum + t.score, 0) / trains.length)}`,
        keyChanges: [
          '3 trains moved from standby to service for peak hour demand',
          '2 trains scheduled for maintenance due to low scores',
          'Energy efficiency improved by 5% through better positioning'
        ],
        recommendations: [
          'Schedule maintenance for trains with scores below 60',
          'Optimize branding exposure for better compliance',
          'Consider energy-efficient routing for shunting operations'
        ],
        warnings: [
          'Only 18 trains available for service - monitor punctuality closely',
          '2 trains require immediate maintenance attention'
        ]
      }
    }
    
    setOptimizationResult(result)
    setIsSimulating(false)
  }

  const applyOptimization = () => {
    if (!optimizationResult) return
    
    setIsAnimating(true)
    
    // Update train positions based on optimization
    const updatedTrains = trains.map(train => {
      const assignment = optimizationResult.assignments.find(a => a.trainId === train.id)
      if (assignment) {
        return {
          ...train,
          targetX: assignment.position.x,
          targetY: assignment.position.y,
          targetZone: assignment.assignedZone,
          status: 'moving' as const,
          movingSpeed: 2
        }
      }
      return train
    })
    
    setTrains(updatedTrains)
    
    // Stop animation after 3 seconds
    setTimeout(() => {
      setIsAnimating(false)
      // Update final positions
      setTrains(updatedTrains.map(train => ({
        ...train,
        x: train.targetX || train.x,
        y: train.targetY || train.y,
        zone: (train.targetZone as any) || train.zone,
        status: 'stationary' as const
      })))
    }, 3000)
  }

  const getOptimizedZone = (score: number): string => {
    if (score >= 80) return 'service'
    if (score >= 60) return 'standby'
    return 'ibl'
  }

  const resetSimulation = () => {
    setIsAnimating(false)
    setOptimizationResult(null)
    initializeTrains()
  }

  if (!hasUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="mb-2">You must be logged in to view the Digital Twin.</p>
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Digital Twin</h1>
        <p className="text-muted-foreground">
          Interactive train yard simulation and optimization with real-time visualization
        </p>
      </div>

      {/* AnyLogic Digital Twin Simulation - Shunt Analysis */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Shunt Analysis - Digital Twin
            </CardTitle>
            <CardDescription>
              Advanced railway simulation model powered by AnyLogic showing real-time shunt operations and optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  This AnyLogic simulation shows real-time train movements, shunt operations optimization, track utilization analysis, and conflict resolution visualization.
                </AlertDescription>
              </Alert>
              
              <div className="rounded-lg border overflow-hidden bg-muted/20">
                <iframe 
                  width="100%" 
                  height="650" 
                  allow="fullscreen" 
                  src="https://cloud.anylogic.com/assets/embed?modelId=56da9169-485e-433d-8628-c37fda4590c5"
                  className="w-full"
                  title="AnyLogic Digital Twin Simulation - Shunt Analysis"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Train className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">Real-time Movements</h4>
                  <p className="text-sm text-blue-600">Live train positioning and routing</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Target className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <h4 className="font-semibold text-green-800">Shunt Optimization</h4>
                  <p className="text-sm text-green-600">Automated shunt operation planning</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold text-purple-800">Track Analysis</h4>
                  <p className="text-sm text-purple-600">Utilization and efficiency metrics</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Simulation Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Desired counts */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Running</Label>
                  <Input type="number" min={0} max={trains.length} value={desiredService} onChange={(e) => setDesiredService(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Standby</Label>
                  <Input type="number" min={0} max={trains.length} value={desiredStandby} onChange={(e) => setDesiredStandby(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Maintenance</Label>
                  <Input type="number" min={0} max={trains.length} value={desiredMaintenance} onChange={(e) => setDesiredMaintenance(Number(e.target.value))} />
                </div>
              </div>
              <Button onClick={applyCountsAndAnimate} className="w-full">
                Apply Counts
              </Button>
              <div>
                <Label htmlFor="scenario">Scenario</Label>
                <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map(scenario => (
                      <SelectItem key={scenario.id} value={scenario.id}>
                        {scenario.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Animation Speed</Label>
                <Select value={animationSpeed.toString()} onValueChange={(v) => setAnimationSpeed(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">Slow</SelectItem>
                    <SelectItem value="1">Normal</SelectItem>
                    <SelectItem value="2">Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={runOptimization} 
                  disabled={isSimulating}
                  className="flex-1"
                >
                  {isSimulating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Optimization
                    </>
                  )}
                </Button>
              </div>
              
              {optimizationResult && (
                <Button 
                  onClick={applyOptimization} 
                  disabled={isAnimating}
                  className="w-full"
                  variant="outline"
                >
                  {isAnimating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                      Animating...
                    </>
                  ) : (
                    <>
                      <Train className="h-4 w-4 mr-2" />
                      Apply Changes
                    </>
                  )}
                </Button>
              )}
              
              <Button 
                onClick={resetSimulation} 
                variant="outline" 
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </CardContent>
          </Card>

          {/* Fleet Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Fleet Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Total Trains</span>
                <Badge variant="outline">{trains.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Service</span>
                <Badge className="bg-green-100 text-green-800">{trains.filter(t => t.zone === 'service').length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Standby</span>
                <Badge className="bg-yellow-100 text-yellow-800">{trains.filter(t => t.zone === 'standby').length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Maintenance</span>
                <Badge className="bg-red-100 text-red-800">{trains.filter(t => t.zone === 'ibl').length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Average Score</span>
                <Badge variant="outline">
                  {Math.round(trains.reduce((sum, t) => sum + t.score, 0) / trains.length)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Visualization */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Train Yard Visualization</CardTitle>
              <CardDescription>
                Interactive 2D visualization of train positions and movements with optimization controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={1000}
                  height={500}
                  className="border rounded-lg bg-gray-50 w-full max-w-[1000px]"
                />
                
                {/* Legend */}
                <div className="absolute top-4 right-4 bg-white dark:bg-slate-900 p-3 rounded-lg shadow-md">
                  <h4 className="font-semibold mb-2 text-slate-900 dark:text-slate-50">Legend</h4>
                  <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>High Score (80+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span>Medium Score (60-79)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Low Score (&lt;60)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Moving</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optimization Results */}
          {optimizationResult && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Optimization Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {optimizationResult.metrics.serviceTrains}
                      </div>
                      <div className="text-sm text-green-600">Service Trains</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {optimizationResult.metrics.standbyTrains}
                      </div>
                      <div className="text-sm text-yellow-600">Standby Trains</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {optimizationResult.metrics.averageScore}%
                      </div>
                      <div className="text-sm text-blue-600">Average Score</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {optimizationResult.metrics.energyEfficiency}%
                      </div>
                      <div className="text-sm text-purple-600">Energy Efficiency</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      {optimizationResult.narrative.summary}
                    </p>
                  </div>
                  
                  {optimizationResult.narrative.warnings.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-red-600">Warnings</h4>
                      <div className="space-y-1">
                        {optimizationResult.narrative.warnings.map((warning, index) => (
                          <Alert key={index} className="border-red-200 bg-red-50">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                              {warning}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold mb-2">Recommendations</h4>
                    <div className="space-y-1">
                      {optimizationResult.narrative.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
