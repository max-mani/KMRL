"use client"

import { useState, useEffect } from "react"
import GATracker from "@/components/ga-tracker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Target,
  Wrench,
  Eye,
  Bell,
  BarChart3
} from "lucide-react"

interface CriticalInsight {
  id: string
  type: 'critical' | 'warning' | 'recommendation' | 'opportunity'
  category: 'fitness' | 'maintenance' | 'branding' | 'energy' | 'safety' | 'efficiency'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  urgency: 'immediate' | 'within-24h' | 'within-week'
  affectedTrains: string[]
  recommendedActions: string[]
  estimatedSavings?: number
  timestamp: string
  resolved: boolean
}

interface InsightMetrics {
  totalInsights: number
  criticalCount: number
  warningCount: number
  recommendationCount: number
  opportunityCount: number
  resolvedCount: number
  pendingCount: number
}

export default function InsightsPage() {
  const [hasUser, setHasUser] = useState<boolean>(false)
  const [hasResults, setHasResults] = useState<boolean>(true)
  const [insights, setInsights] = useState<CriticalInsight[]>([])
  const [metrics, setMetrics] = useState<InsightMetrics>({
    totalInsights: 0,
    criticalCount: 0,
    warningCount: 0,
    recommendationCount: 0,
    opportunityCount: 0,
    resolvedCount: 0,
    pendingCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const user = localStorage.getItem('kmrl-user')
      setHasUser(!!user)
      const results = localStorage.getItem('kmrl-optimization-results')
      setHasResults(!!results)
    } catch {}

    const fetchInsights = async () => {
      try {
        // derive simple insights from uploaded results
        const raw = localStorage.getItem('kmrl-optimization-results')
        const results: any[] = raw ? JSON.parse(raw) : []
        const derived: CriticalInsight[] = results.slice(0, 8).map((r, idx) => ({
          id: String(idx + 1),
          type: r.score < 60 ? 'critical' : r.score < 75 ? 'warning' : 'recommendation',
          category: 'efficiency',
          title: `${r.trainId || 'Train'} optimization insight`,
          description: r.reason || 'Generated from optimization results',
          impact: r.score < 60 ? 'high' : r.score < 75 ? 'medium' : 'low',
          urgency: r.score < 60 ? 'immediate' : r.score < 75 ? 'within-24h' : 'within-week',
          affectedTrains: [r.trainId || `T${idx + 1}`],
          recommendedActions: [
            r.score < 60 ? 'Schedule maintenance' : 'Deploy to service',
            'Review factor breakdown'
          ],
          estimatedSavings: undefined,
          timestamp: new Date().toISOString(),
          resolved: false
        }))

        setInsights(derived)
        const newMetrics: InsightMetrics = {
          totalInsights: derived.length,
          criticalCount: derived.filter(i => i.type === 'critical').length,
          warningCount: derived.filter(i => i.type === 'warning').length,
          recommendationCount: derived.filter(i => i.type === 'recommendation').length,
          opportunityCount: derived.filter(i => i.type === 'opportunity').length,
          resolvedCount: derived.filter(i => i.resolved).length,
          pendingCount: derived.filter(i => !i.resolved).length
        }
        setMetrics(newMetrics)
      } catch (error) {
        console.error('Error fetching insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'recommendation': return <TrendingUp className="h-5 w-5 text-blue-500" />
      case 'opportunity': return <Target className="h-5 w-5 text-green-500" />
      default: return <Eye className="h-5 w-5 text-gray-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'recommendation': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'opportunity': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-100 text-red-800'
      case 'within-24h': return 'bg-orange-100 text-orange-800'
      case 'within-week': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fitness': return <CheckCircle className="h-4 w-4" />
      case 'maintenance': return <Wrench className="h-4 w-4" />
      case 'branding': return <Target className="h-4 w-4" />
      case 'energy': return <Zap className="h-4 w-4" />
      case 'safety': return <AlertTriangle className="h-4 w-4" />
      case 'efficiency': return <BarChart3 className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  if (!hasUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="mb-2">You must be logged in to view Critical Insights.</p>
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--kmrl-teal)]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <GATracker page="insights" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Critical Insights</h1>
        <p className="text-muted-foreground">
          AI-powered insights and recommendations for fleet optimization and operational excellence
        </p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalInsights}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingCount} pending, {metrics.resolvedCount} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.criticalCount}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.opportunityCount}</div>
            <p className="text-xs text-muted-foreground">
              Potential savings identified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.recommendationCount}</div>
            <p className="text-xs text-muted-foreground">
              Optimization suggestions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="warnings">Warnings</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id} className={`border-l-4 ${
                insight.type === 'critical' ? 'border-red-500' : 
                insight.type === 'warning' ? 'border-yellow-500' :
                insight.type === 'recommendation' ? 'border-blue-500' :
                'border-green-500'
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getTypeIcon(insight.type)}
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{insight.title}</CardTitle>
                        <CardDescription className="text-base mb-3">
                          {insight.description}
                        </CardDescription>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getTypeColor(insight.type)}>
                            {insight.type}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getCategoryIcon(insight.category)}
                            {insight.category}
                          </Badge>
                          <Badge className={getUrgencyColor(insight.urgency)}>
                            {insight.urgency.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getImpactColor(insight.impact)}>
                            Impact: {insight.impact}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          Affected Trains: {insight.affectedTrains.join(', ')}
                        </div>
                        {insight.estimatedSavings && (
                          <div className="text-sm font-medium text-green-600 mb-3">
                            Potential Savings: ₹{insight.estimatedSavings.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant={insight.resolved ? "default" : "secondary"}>
                        {insight.resolved ? 'Resolved' : 'Pending'}
                      </Badge>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Recommended Actions:</h4>
                      <ul className="space-y-1">
                        {insight.recommendedActions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Generated: {new Date(insight.timestamp).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="critical" className="space-y-4">
          <div className="space-y-4">
            {insights.filter(insight => insight.type === 'critical').map((insight) => (
              <Card key={insight.id} className="border-l-4 border-red-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{insight.title}</CardTitle>
                        <CardDescription className="text-base mb-3">
                          {insight.description}
                        </CardDescription>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            critical
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getCategoryIcon(insight.category)}
                            {insight.category}
                          </Badge>
                          <Badge className={getUrgencyColor(insight.urgency)}>
                            {insight.urgency.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="destructive">
                      Take Action
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Immediate Actions Required:</h4>
                      <ul className="space-y-1">
                        {insight.recommendedActions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="warnings" className="space-y-4">
          <div className="space-y-4">
            {insights.filter(insight => insight.type === 'warning').map((insight) => (
              <Card key={insight.id} className="border-l-4 border-yellow-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{insight.title}</CardTitle>
                        <CardDescription className="text-base mb-3">
                          {insight.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="space-y-4">
            {insights.filter(insight => insight.type === 'opportunity').map((insight) => (
              <Card key={insight.id} className="border-l-4 border-green-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{insight.title}</CardTitle>
                        <CardDescription className="text-base mb-3">
                          {insight.description}
                        </CardDescription>
                        {insight.estimatedSavings && (
                          <div className="text-sm font-medium text-green-600 mb-3">
                            Potential Savings: ₹{insight.estimatedSavings.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Explore
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {insights.filter(insight => insight.type === 'recommendation').map((insight) => (
              <Card key={insight.id} className="border-l-4 border-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{insight.title}</CardTitle>
                        <CardDescription className="text-base mb-3">
                          {insight.description}
                        </CardDescription>
                        {insight.estimatedSavings && (
                          <div className="text-sm font-medium text-green-600 mb-3">
                            Potential Savings: ₹{insight.estimatedSavings.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Implement
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
