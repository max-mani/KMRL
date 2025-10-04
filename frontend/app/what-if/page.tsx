"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Wrench,
  Train,
  Target,
  Zap
} from "lucide-react"
import GATracker from "@/components/ga-tracker"
import { useManualOverride } from "@/components/manual-override"

interface WhatIfScenario {
  id: string
  name: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  efficiency: number
  cost: number
  conflicts: number
  recommendations: string[]
}

interface ConflictAnalysis {
  trainId: string
  conflictType: string
  severity: 'Low' | 'Medium' | 'High'
  description: string
  resolution: string
  impact: number
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

  if (!mounted || isAuthed === null) return null

  if (!isAuthed) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="mb-2">You must be logged in to view What-If Analysis.</p>
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

export default function WhatIfPage() {
  const { overrides } = useManualOverride()
  const [scenarios, setScenarios] = useState<WhatIfScenario[]>([])
  const [conflicts, setConflicts] = useState<ConflictAnalysis[]>([])
  const [activeTab, setActiveTab] = useState("scenarios")

  useEffect(() => {
    // Generate scenarios based on current overrides
    const generatedScenarios: WhatIfScenario[] = [
      {
        id: "scenario-1",
        name: "Current Configuration",
        description: "Analysis of current train status and ranking configuration",
        impact: 'neutral',
        efficiency: 85,
        cost: 15000,
        conflicts: 2,
        recommendations: ["Maintain current configuration", "Monitor high-priority trains"]
      },
      {
        id: "scenario-2", 
        name: "Optimized Ranking",
        description: "Re-rank trains based on performance scores and maintenance schedules",
        impact: 'positive',
        efficiency: 92,
        cost: 12000,
        conflicts: 0,
        recommendations: ["Implement automated ranking", "Schedule maintenance during off-peak"]
      },
      {
        id: "scenario-3",
        name: "Maintenance Priority",
        description: "Prioritize maintenance for low-scoring trains",
        impact: 'positive',
        efficiency: 88,
        cost: 18000,
        conflicts: 1,
        recommendations: ["Increase maintenance capacity", "Extend maintenance windows"]
      }
    ]

    setScenarios(generatedScenarios)

    // Generate conflicts based on overrides
    const generatedConflicts: ConflictAnalysis[] = []
    
    Object.entries(overrides).forEach(([key, value]) => {
      if (key.includes('train.status')) {
        const trainId = key.split('.')[2]
        if (value === 'maintenance') {
          generatedConflicts.push({
            trainId,
            conflictType: 'Maintenance Override',
            severity: 'Medium',
            description: `Train ${trainId} manually set to maintenance`,
            resolution: 'Verify maintenance schedule and resource availability',
            impact: 15
          })
        }
      }
      
      if (key.includes('train.score')) {
        const trainId = key.split('.')[2]
        if (typeof value === 'number' && value < 50) {
          generatedConflicts.push({
            trainId,
            conflictType: 'Low Score Override',
            severity: 'High',
            description: `Train ${trainId} score manually reduced to ${value}`,
            resolution: 'Review score justification and consider maintenance',
            impact: 25
          })
        }
      }
    })

    setConflicts(generatedConflicts)
  }, [overrides])

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Protected>
      <section className="container mx-auto px-4 py-8">
        <GATracker page="what_if" />
        
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-balance" style={{ color: "var(--kmrl-teal)" }}>
            What-If Analysis
          </h1>
          <p className="text-sm text-muted-foreground">
            Analyze the impact of manual overrides and explore different operational scenarios.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="conflicts">Conflict Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="space-y-6">
            {/* Scenario Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenarios.map((scenario) => (
                <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{scenario.name}</CardTitle>
                      {getImpactIcon(scenario.impact)}
                    </div>
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{scenario.efficiency}%</p>
                        <p className="text-xs text-muted-foreground">Efficiency</p>
                </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">₹{scenario.cost.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Daily Cost</p>
                </div>
              </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-semibold text-red-600">{scenario.conflicts}</p>
                      <p className="text-xs text-muted-foreground">Conflicts</p>
              </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Recommendations:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {scenario.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
              </div>

                    <Button className="w-full" variant="outline">
                      Apply Scenario
              </Button>
            </CardContent>
          </Card>
              ))}
            </div>

            {/* Summary Card */}
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analysis Summary
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">92%</div>
                    <p className="text-sm text-muted-foreground">Best Efficiency</p>
                    <p className="text-xs text-muted-foreground">Optimized Ranking Scenario</p>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">₹12K</div>
                    <p className="text-sm text-muted-foreground">Lowest Cost</p>
                    <p className="text-xs text-muted-foreground">Optimized Ranking Scenario</p>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">0</div>
                    <p className="text-sm text-muted-foreground">Min Conflicts</p>
                    <p className="text-xs text-muted-foreground">Optimized Ranking Scenario</p>
                  </div>
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="conflicts" className="space-y-6">
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
                    <div className="space-y-4">
                      {conflicts.map((conflict, index) => (
                        <div key={index} className={`p-4 rounded-lg border ${
                          conflict.severity === 'High' ? 'border-red-200 bg-red-50' :
                          conflict.severity === 'Medium' ? 'border-yellow-200 bg-yellow-50' :
                          'border-blue-200 bg-blue-50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{conflict.conflictType}</h4>
                                <Badge className={getSeverityColor(conflict.severity)}>
                                  {conflict.severity}
                                </Badge>
                                <Badge variant="outline">
                                  Impact: {conflict.impact}%
                                </Badge>
                </div>
                              <p className="text-sm text-muted-foreground mb-2">{conflict.description}</p>
                              <p className="text-sm font-medium">Resolution: {conflict.resolution}</p>
                </div>
                </div>
              </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <h3 className="text-lg font-semibold mb-2">No Conflicts Detected</h3>
                      <p className="text-muted-foreground">Your current configuration appears to be conflict-free.</p>
              </div>
                  )}
              </div>
            </CardContent>
          </Card>

            {/* Impact Analysis */}
            <Card>
          <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Impact Analysis
                </CardTitle>
          </CardHeader>
          <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Positive Impacts</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Improved maintenance scheduling</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Better resource utilization</span>
                          </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Reduced operational conflicts</span>
                      </div>
                    </div>
                </div>
              
                <div className="space-y-4">
                    <h4 className="font-semibold">Risk Factors</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Manual override dependencies</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Potential maintenance delays</span>
                          </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Resource allocation challenges</span>
                      </div>
                    </div>
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