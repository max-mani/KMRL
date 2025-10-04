"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  Settings, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Edit3,
  Train,
  MapPin,
  Wrench,
  Shield,
  Calendar,
  BarChart3,
  Zap,
  Target,
  TrendingUp,
  Clock
} from "lucide-react"
import { useManualOverride } from "@/components/manual-override"
import GATracker from "@/components/ga-tracker"
import { GeminiAnalysisService } from "@/lib/gemini-analysis-service"

interface TrainData {
  trainId: string
  score: number
  status: 'running' | 'standby' | 'maintenance'
  failureRisk: 'Low' | 'Medium' | 'High'
  depot: string
  cleaningSlot: number
  stablingPosition: string
  rank: number
}

interface ConflictAnalysis {
  trainId: string
  conflictType: string
  severity: 'Low' | 'Medium' | 'High'
  description: string
  resolution: string
}

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
            <p className="mb-2">You must be logged in to view manual overrides.</p>
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

export default function ManualOverridePage() {
  const { overrides, setOverride, clearOverride, clearAll } = useManualOverride()
  const [isLoading, setIsLoading] = useState(false)
  const [trains, setTrains] = useState<TrainData[]>([])
  const [conflicts, setConflicts] = useState<ConflictAnalysis[]>([])
  const [activeTab, setActiveTab] = useState("train-ranking")
  const [fleetAnalysis, setFleetAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Load train data from localStorage (from dashboard optimization results)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('kmrl-optimization-results')
      if (raw) {
        const results = JSON.parse(raw)
        const trainData: TrainData[] = results.map((train: any, index: number) => ({
          trainId: train.trainId,
          score: train.score,
          status: train.score >= 65 ? 'running' : train.score >= 50 ? 'standby' : 'maintenance',
          failureRisk: train.score >= 80 ? 'Low' : train.score >= 60 ? 'Medium' : 'High',
          depot: 'Muttom Depot',
          cleaningSlot: train.score >= 80 ? (index % 3) + 1 : train.score >= 60 ? (index % 3) + 4 : (index % 2) + 7,
          stablingPosition: `Track-${train.score >= 70 ? (index % 10) + 1 : (index % 10) + 11}`,
          rank: index + 1
        }))
        setTrains(trainData)
      }
    } catch (error) {
      console.error('Error loading train data:', error)
    }
  }, [])

  // Generate analysis when trains data changes
  useEffect(() => {
    if (trains.length > 0) {
      generateDynamicAnalysis()
    }
  }, [trains])

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleRankChange = (trainId: string, newRank: number) => {
    setTrains(prev => {
      const updated = [...prev]
      const trainIndex = updated.findIndex(t => t.trainId === trainId)
      if (trainIndex !== -1) {
        // Swap ranks with the train that currently has this rank
        const otherTrainIndex = updated.findIndex(t => t.rank === newRank)
        if (otherTrainIndex !== -1) {
          updated[otherTrainIndex].rank = updated[trainIndex].rank
        }
        updated[trainIndex].rank = newRank
        // Sort by rank
        return updated.sort((a, b) => a.rank - b.rank)
      }
      return updated
    })
  }

  const handleStatusChange = (trainId: string, newStatus: 'running' | 'standby' | 'maintenance') => {
    setTrains(prev => prev.map(train => 
      train.trainId === trainId ? { ...train, status: newStatus } : train
    ))
    // Save to overrides
    setOverride(`train.status.${trainId}`, newStatus)
  }

  const handleScoreChange = (trainId: string, newScore: number) => {
    setTrains(prev => prev.map(train => 
      train.trainId === trainId ? { ...train, score: newScore } : train
    ))
    // Save to overrides
    setOverride(`train.score.${trainId}`, newScore)
  }

  const generateDynamicAnalysis = async () => {
    if (trains.length === 0) return

    setIsAnalyzing(true)
    try {
      const analysis = await GeminiAnalysisService.analyzeFleetData(trains)
      setFleetAnalysis(analysis)
      
      // Convert conflicts to the expected format
      const newConflicts: ConflictAnalysis[] = analysis.conflictAnalysis.conflicts.map(conflict => ({
        trainId: 'Fleet',
        conflictType: conflict.type,
        severity: conflict.severity,
        description: conflict.description,
        resolution: conflict.resolution
      }))
      setConflicts(newConflicts)
    } catch (error) {
      console.error('Error generating analysis:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const analyzeConflicts = () => {
    generateDynamicAnalysis()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700'
      case 'standby': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700'
      case 'maintenance': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'standby': return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      case 'maintenance': return <Wrench className="h-4 w-4 text-red-600 dark:text-red-400" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  return (
    <Protected>
      <section className="container mx-auto px-4 py-8">
        <GATracker page="manual_override" />
        
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-balance" style={{ color: "var(--kmrl-teal)" }}>
              Train Ranking & Status Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Edit train rankings, change status, and analyze conflicts with what-if scenarios.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => {
              analyzeConflicts()
              setActiveTab("what-if")
            }} disabled={isAnalyzing}>
              <BarChart3 className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Conflicts'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="train-ranking">Train Ranking</TabsTrigger>
            <TabsTrigger value="what-if">What-If Analysis</TabsTrigger>
            <TabsTrigger value="shunt-analysis">Shunt Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="train-ranking" className="space-y-6">
            {/* Train Ranking Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Train className="h-5 w-5" />
                  Editable Train Rank List
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
                        <th className="text-left p-3 font-semibold">Score</th>
                        <th className="text-left p-3 font-semibold">Failure Risk</th>
                        <th className="text-left p-3 font-semibold">Depot</th>
                        <th className="text-left p-3 font-semibold">Cleaning Slot</th>
                        <th className="text-left p-3 font-semibold">Stabling Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trains.map((train) => (
                        <tr key={train.trainId} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <Input
                              type="number"
                              value={train.rank}
                              onChange={(e) => handleRankChange(train.trainId, parseInt(e.target.value))}
                              className="w-16 text-center"
                              min={1}
                              max={trains.length}
                            />
                          </td>
                          <td className="p-3 font-semibold">{train.trainId}</td>
                          <td className="p-3">
                            <select
                              value={train.status}
                              onChange={(e) => handleStatusChange(train.trainId, e.target.value as 'running' | 'standby' | 'maintenance')}
                              className="px-2 py-1 rounded border bg-background text-foreground border-input focus:border-ring focus:ring-2 focus:ring-ring/20"
                            >
                              <option value="running">Running</option>
                              <option value="standby">Standby</option>
                              <option value="maintenance">Maintenance</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={train.score}
                              onChange={(e) => handleScoreChange(train.trainId, parseInt(e.target.value))}
                              className="w-20 text-center"
                              min={0}
                              max={100}
                            />
                          </td>
                          <td className="p-3">
                            <Badge className={train.failureRisk === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : train.failureRisk === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}>
                              {train.failureRisk}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm">{train.depot}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              <span className="font-mono text-sm">Slot-{train.cleaningSlot}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Train className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              <span className="font-mono text-sm">{train.stablingPosition}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="what-if" className="space-y-6">
            {/* What-If Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Control Panel */}
              <div className="lg:col-span-1 space-y-6">
                {/* Fleet Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Fleet Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Trains</span>
                      <Badge variant="outline">{fleetAnalysis?.fleetSummary?.totalTrains || trains.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Service</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {fleetAnalysis?.fleetSummary?.serviceTrains || trains.filter(t => t.status === 'running').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Standby</span>
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        {fleetAnalysis?.fleetSummary?.standbyTrains || trains.filter(t => t.status === 'standby').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Maintenance</span>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        {fleetAnalysis?.fleetSummary?.maintenanceTrains || trains.filter(t => t.status === 'maintenance').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Score</span>
                      <Badge variant="outline">
                        {fleetAnalysis?.fleetSummary?.averageScore || Math.round(trains.reduce((sum, t) => sum + t.score, 0) / trains.length)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Conflict Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Conflict Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Analysis of conflicts arising from manual overrides and their operational impact.
                        </AlertDescription>
                      </Alert>
                      
                      {conflicts.length > 0 ? (
                        <div className="space-y-3">
                          {conflicts.map((conflict, index) => (
                            <div key={index} className={`p-3 rounded-lg border ${
                              conflict.severity === 'High' ? 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20' :
                              conflict.severity === 'Medium' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20' :
                              'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                            }`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold text-sm">{conflict.conflictType}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">{conflict.description}</p>
                                </div>
                                <Badge className={
                                  conflict.severity === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                  conflict.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }>
                                  {conflict.severity}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <h3 className="text-sm font-semibold mb-1">No Conflicts Detected</h3>
                          <p className="text-xs text-muted-foreground">Configuration appears optimal.</p>
                        </div>
                      )}
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
                      Real-time 2D visualization of train positions and movements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <div className="w-full h-96 border rounded-lg bg-muted/20 dark:bg-muted/10 flex items-center justify-center">
                        <div className="text-center">
                          <Train className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">Train Yard Visualization</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Interactive 2D visualization showing train positions and movements
                          </p>
                        </div>
                      </div>
                      
                      {/* Legend */}
                      <div className="absolute top-4 right-4 bg-background border p-3 rounded-lg shadow-md">
                        <h4 className="font-semibold mb-2">Legend</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
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
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {fleetAnalysis?.optimizationResults?.serviceTrains || 4}
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400">Service Trains</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {fleetAnalysis?.optimizationResults?.standbyTrains || 11}
                          </div>
                          <div className="text-sm text-yellow-600 dark:text-yellow-400">Standby Trains</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {fleetAnalysis?.optimizationResults?.averageScore || 64}%
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400">Average Score</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {fleetAnalysis?.optimizationResults?.energyEfficiency || 94}%
                          </div>
                          <div className="text-sm text-purple-600 dark:text-purple-400">Energy Efficiency</div>
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
                          {fleetAnalysis?.keyInsights?.summary || `Optimization completed: ${trains.length} trains assigned with average score of ${Math.round(trains.reduce((sum, t) => sum + t.score, 0) / trains.length)}`}
                        </p>
                      </div>
                      
                      {fleetAnalysis?.keyInsights?.warnings && fleetAnalysis.keyInsights.warnings.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 text-red-600 dark:text-red-400">Warnings</h4>
                          <div className="space-y-1">
                            {fleetAnalysis.keyInsights.warnings.map((warning: string, index: number) => (
                              <Alert key={index} className="border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20">
                                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                <AlertDescription className="text-red-800 dark:text-red-200">
                                  {warning}
                                </AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {fleetAnalysis?.keyInsights?.recommendations && fleetAnalysis.keyInsights.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Recommendations</h4>
                          <div className="space-y-1">
                            {fleetAnalysis.keyInsights.recommendations.map((recommendation: string, index: number) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{recommendation}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shunt-analysis" className="space-y-6">
            {/* Shunt Analysis with Digital Twin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Shunt Analysis - Digital Twin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      Digital Twin simulation powered by AnyLogic showing real-time shunt operations and optimization.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="border rounded-lg overflow-hidden bg-muted/20 dark:bg-muted/10">
                    <iframe 
                      width="1000" 
                      height="650" 
                      allow="fullscreen" 
                      src="https://cloud.anylogic.com/assets/embed?modelId=56da9169-485e-433d-8628-c37fda4590c5"
                      className="w-full"
                      title="AnyLogic Digital Twin Simulation - Shunt Analysis"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </Protected>
  )
}
