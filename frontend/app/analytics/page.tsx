"use client"

import { useState, useEffect } from "react"
import GATracker from "@/components/ga-tracker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts"
import { TrendingUp, TrendingDown, Clock, Zap, Target, AlertCircle, Brain, Lightbulb, DollarSign, Activity, BarChart3, PieChart as PieChartIcon } from "lucide-react"

interface AnalyticsData {
  historicalData: {
    averageScore: number
    punctuality: number
    energyEfficiency: number
    shuntingCost: number
    changes: {
      averageScoreChange: number
      punctualityChange: number
      energyEfficiencyChange: number
      costChange: number
    }
  }
  insights: {
    totalInsights: number
    criticalCount: number
    warningCount: number
    recommendationCount: number
    opportunityCount: number
    resolvedCount: number
    pendingCount: number
  }
  insightsList: Array<{
    id: string
    type: 'critical' | 'warning' | 'opportunity' | 'recommendation'
    category: string
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    urgency: string
    affectedTrains: string[]
    recommendedActions: string[]
    estimatedSavings?: number
    timestamp: string
    resolved: boolean
  }>
  systemPerformance: {
    punctuality: number
    energyEfficiency: number
    mileageBalance: number
    brandingCompliance: number
    averageScore: number
    shuntingCost: number
  }
  trends: {
    punctuality: Array<{ date: string; value: number }>
    energyEfficiency: Array<{ date: string; value: number }>
    mileageBalance: Array<{ date: string; value: number }>
    brandingCompliance: Array<{ date: string; value: number }>
  }
  fleetDistribution: Array<{ name: string; value: number; color: string }>
  energyConsumption: Array<{ hour: string; consumption: number }>
}

export default function AnalyticsPage() {
  const [hasUser, setHasUser] = useState<boolean>(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    historicalData: {
      averageScore: 0,
      punctuality: 0,
      energyEfficiency: 0,
      shuntingCost: 0,
      changes: {
        averageScoreChange: 0,
        punctualityChange: 0,
        energyEfficiencyChange: 0,
        costChange: 0
      }
    },
    insights: {
      totalInsights: 0,
      criticalCount: 0,
      warningCount: 0,
      recommendationCount: 0,
      opportunityCount: 0,
      resolvedCount: 0,
      pendingCount: 0
    },
    insightsList: [],
    systemPerformance: {
      punctuality: 0,
      energyEfficiency: 0,
      mileageBalance: 0,
      brandingCompliance: 0,
      averageScore: 0,
      shuntingCost: 0
    },
    trends: {
      punctuality: [],
      energyEfficiency: [],
      mileageBalance: [],
      brandingCompliance: []
    },
    fleetDistribution: [],
    energyConsumption: []
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    try {
      const user = localStorage.getItem('kmrl-user')
      setHasUser(!!user)
    } catch {}

    const fetchAnalyticsData = async () => {
      try {
        const token = localStorage.getItem('kmrl-token')
        if (!token) {
          setLoading(false)
          return
        }

        // Fetch all analytics data in parallel
        const [historicalResponse, insightsResponse, performanceResponse] = await Promise.all([
          fetch('http://localhost:3001/api/performance/history', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('http://localhost:3001/api/performance/insights', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('http://localhost:3001/api/performance/metrics', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ])

        if (historicalResponse.ok && insightsResponse.ok && performanceResponse.ok) {
          const [historicalData, insightsData, performanceData] = await Promise.all([
            historicalResponse.json(),
            insightsResponse.json(),
            performanceResponse.json()
          ])

          if (historicalData.success && insightsData.success && performanceData.success) {
            setAnalyticsData({
              historicalData: {
                averageScore: historicalData.data.comparisonData.today.averageScore,
                punctuality: historicalData.data.comparisonData.today.punctuality,
                energyEfficiency: historicalData.data.comparisonData.today.energyEfficiency,
                shuntingCost: historicalData.data.comparisonData.today.cost,
                changes: historicalData.data.comparisonData.changes
              },
              insights: insightsData.data.metrics,
              insightsList: insightsData.data.insights,
              systemPerformance: performanceData.data.kpis,
              trends: performanceData.data.trends,
              fleetDistribution: performanceData.data.fleetDistribution,
               energyConsumption: performanceData.data.energyConsumption,
               performanceAlerts: performanceData.data.alerts || []
            })
          }
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  const getKpiColor = (value: number, threshold: number = 90) => {
    if (value >= threshold) return 'text-green-600'
    if (value >= threshold - 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getKpiIcon = (value: number, threshold: number = 90) => {
    if (value >= threshold) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (value >= threshold - 10) return <TrendingUp className="h-4 w-4 text-yellow-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" />
    return <Activity className="h-3 w-3 text-gray-500" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'opportunity': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'recommendation': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'opportunity': return <Lightbulb className="h-4 w-4 text-blue-600" />
      case 'recommendation': return <Brain className="h-4 w-4 text-green-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredInsights = analyticsData.insightsList.filter(insight => 
    activeTab === 'all' || insight.type === activeTab
  )

  if (!hasUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="mb-2">You must be logged in to view Overview.</p>
            <a href="/login" className="underline" style={{ color: "var(--kmrl-teal)" }}>Go to Login</a>
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
      <GATracker page="analytics" />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Overview Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive analysis of fleet performance, historical trends, and AI-powered insights
        </p>
      </div>

      {/* Historical Data Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Historical Data</h2>
        <p className="text-muted-foreground mb-6">Analyze historical performance trends and optimization outcomes</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`text-2xl font-bold ${getKpiColor(analyticsData.historicalData.averageScore, 85)}`}>
                  {analyticsData.historicalData.averageScore}%
                </div>
                {getKpiIcon(analyticsData.historicalData.averageScore, 85)}
              </div>
              <div className="flex items-center space-x-1 mt-1">
                {getChangeIcon(analyticsData.historicalData.changes.averageScoreChange)}
                <span className={`text-xs ${getChangeColor(analyticsData.historicalData.changes.averageScoreChange)}`}>
                  {Math.abs(analyticsData.historicalData.changes.averageScoreChange)}% vs yesterday
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Punctuality</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`text-2xl font-bold ${getKpiColor(analyticsData.historicalData.punctuality, 99)}`}>
                  {analyticsData.historicalData.punctuality}%
                </div>
                {getKpiIcon(analyticsData.historicalData.punctuality, 99)}
              </div>
              <div className="flex items-center space-x-1 mt-1">
                {getChangeIcon(analyticsData.historicalData.changes.punctualityChange)}
                <span className={`text-xs ${getChangeColor(analyticsData.historicalData.changes.punctualityChange)}`}>
                  {Math.abs(analyticsData.historicalData.changes.punctualityChange)}% vs yesterday
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Energy Efficiency</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`text-2xl font-bold ${getKpiColor(analyticsData.historicalData.energyEfficiency, 90)}`}>
                  {analyticsData.historicalData.energyEfficiency}%
                </div>
                {getKpiIcon(analyticsData.historicalData.energyEfficiency, 90)}
              </div>
              <div className="flex items-center space-x-1 mt-1">
                {getChangeIcon(analyticsData.historicalData.changes.energyEfficiencyChange)}
                <span className={`text-xs ${getChangeColor(analyticsData.historicalData.changes.energyEfficiencyChange)}`}>
                  {Math.abs(analyticsData.historicalData.changes.energyEfficiencyChange)}% vs yesterday
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shunting Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-blue-600">
                  ₹{analyticsData.historicalData.shuntingCost}
                </div>
                {getChangeIcon(analyticsData.historicalData.changes.costChange)}
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <span className={`text-xs ${getChangeColor(analyticsData.historicalData.changes.costChange)}`}>
                  ₹{Math.abs(analyticsData.historicalData.changes.costChange)} vs yesterday
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Critical Insights Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Critical Insights</h2>
        <p className="text-muted-foreground mb-6">AI-powered insights and recommendations for fleet optimization and operational excellence</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.insights.totalInsights}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.insights.pendingCount} pending, {analyticsData.insights.resolvedCount} resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analyticsData.insights.criticalCount}</div>
              <p className="text-xs text-muted-foreground">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
              <Lightbulb className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analyticsData.insights.opportunityCount}</div>
              <p className="text-xs text-muted-foreground">Potential savings identified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analyticsData.insights.recommendationCount}</div>
              <p className="text-xs text-muted-foreground">Optimization suggestions</p>
            </CardContent>
          </Card>
        </div>

        {/* Insights Filter and List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Insights & Recommendations</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="critical">Critical</TabsTrigger>
                  <TabsTrigger value="warning">Warnings</TabsTrigger>
                  <TabsTrigger value="opportunity">Opportunities</TabsTrigger>
                  <TabsTrigger value="recommendation">Recommendations</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredInsights.map((insight) => (
                <Card key={insight.id} className={`border-l-4 ${
                  insight.type === 'critical' ? 'border-red-500' : 
                  insight.type === 'warning' ? 'border-yellow-500' : 
                  insight.type === 'opportunity' ? 'border-blue-500' : 'border-green-500'
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.type)}
                        <CardTitle className="text-sm">{insight.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getInsightTypeColor(insight.type)}>
                          {insight.type}
                        </Badge>
                        {insight.estimatedSavings && (
                          <Badge variant="outline" className="text-green-600">
                            ₹{insight.estimatedSavings.toLocaleString()} savings
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Impact: {insight.impact}</span>
                      <span>Urgency: {insight.urgency}</span>
                      <span>{new Date(insight.timestamp).toLocaleString()}</span>
                    </div>
                    {insight.recommendedActions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium mb-1">Recommended Actions:</p>
                        <ul className="text-xs text-muted-foreground list-disc list-inside">
                          {insight.recommendedActions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Issues Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Critical Issues</h2>
        <p className="text-muted-foreground mb-6">Issues requiring immediate attention and resolution</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyticsData.insightsList
            .filter(insight => insight.type === 'critical')
            .slice(0, 6)
            .map((insight) => (
              <Card key={insight.id} className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <CardTitle className="text-sm text-red-800 dark:text-red-200">{insight.title}</CardTitle>
                    </div>
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      Critical
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-3">{insight.description}</p>
                  <div className="flex items-center gap-4 text-xs text-red-600 dark:text-red-400">
                    <span>Impact: {insight.impact}</span>
                    <span>Urgency: {insight.urgency}</span>
                  </div>
                  {insight.estimatedSavings && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        ₹{insight.estimatedSavings.toLocaleString()} potential savings
                      </Badge>
                    </div>
                  )}
                  {insight.recommendedActions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium mb-1 text-red-700 dark:text-red-300">Recommended Actions:</p>
                      <ul className="text-xs text-red-600 dark:text-red-400 list-disc list-inside">
                        {insight.recommendedActions.slice(0, 2).map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Warnings Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Warnings</h2>
        <p className="text-muted-foreground mb-6">Issues that require attention within 24 hours</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyticsData.insightsList
            .filter(insight => insight.type === 'warning')
            .slice(0, 6)
            .map((insight) => (
              <Card key={insight.id} className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <CardTitle className="text-sm text-yellow-800 dark:text-yellow-200">{insight.title}</CardTitle>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      Warning
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">{insight.description}</p>
                  <div className="flex items-center gap-4 text-xs text-yellow-600 dark:text-yellow-400">
                    <span>Impact: {insight.impact}</span>
                    <span>Urgency: {insight.urgency}</span>
                  </div>
                  {insight.estimatedSavings && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        ₹{insight.estimatedSavings.toLocaleString()} potential savings
                      </Badge>
                    </div>
                  )}
                  {insight.recommendedActions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium mb-1 text-yellow-700 dark:text-yellow-300">Recommended Actions:</p>
                      <ul className="text-xs text-yellow-600 dark:text-yellow-400 list-disc list-inside">
                        {insight.recommendedActions.slice(0, 2).map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Recommendations</h2>
        <p className="text-muted-foreground mb-6">Strategic optimization suggestions for long-term improvements</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyticsData.insightsList
            .filter(insight => insight.type === 'recommendation')
            .slice(0, 6)
            .map((insight) => (
              <Card key={insight.id} className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-green-600" />
                      <CardTitle className="text-sm text-green-800 dark:text-green-200">{insight.title}</CardTitle>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Recommendation
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-3">{insight.description}</p>
                  <div className="flex items-center gap-4 text-xs text-green-600 dark:text-green-400">
                    <span>Impact: {insight.impact}</span>
                    <span>Urgency: {insight.urgency}</span>
                  </div>
                  {insight.estimatedSavings && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        ₹{insight.estimatedSavings.toLocaleString()} potential savings
                      </Badge>
                    </div>
                  )}
                  {insight.recommendedActions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium mb-1 text-green-700 dark:text-green-300">Recommended Actions:</p>
                      <ul className="text-xs text-green-600 dark:text-green-400 list-disc list-inside">
                        {insight.recommendedActions.slice(0, 2).map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* System Performance Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">System Performance</h2>
        <p className="text-muted-foreground mb-6">Monitor key performance indicators, energy consumption, and fleet optimization metrics</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Punctuality</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`text-2xl font-bold ${getKpiColor(analyticsData.systemPerformance.punctuality, 99)}`}>
                  {analyticsData.systemPerformance.punctuality}%
                </div>
                {getKpiIcon(analyticsData.systemPerformance.punctuality, 99)}
              </div>
              <p className="text-xs text-muted-foreground">
                Target: 99.5% | Current: {analyticsData.systemPerformance.punctuality}%
              </p>
              <Progress 
                value={analyticsData.systemPerformance.punctuality} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Energy Efficiency</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`text-2xl font-bold ${getKpiColor(analyticsData.systemPerformance.energyEfficiency, 90)}`}>
                  {analyticsData.systemPerformance.energyEfficiency}%
                </div>
                {getKpiIcon(analyticsData.systemPerformance.energyEfficiency, 90)}
              </div>
              <p className="text-xs text-muted-foreground">
                Target: 90% | Current: {analyticsData.systemPerformance.energyEfficiency}%
              </p>
              <Progress 
                value={analyticsData.systemPerformance.energyEfficiency} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mileage Balance</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`text-2xl font-bold ${getKpiColor(analyticsData.systemPerformance.mileageBalance, 90)}`}>
                  {analyticsData.systemPerformance.mileageBalance}%
                </div>
                {getKpiIcon(analyticsData.systemPerformance.mileageBalance, 90)}
              </div>
              <p className="text-xs text-muted-foreground">
                Target: 90% | Current: {analyticsData.systemPerformance.mileageBalance}%
              </p>
              <Progress 
                value={analyticsData.systemPerformance.mileageBalance} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Branding Compliance</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`text-2xl font-bold ${getKpiColor(analyticsData.systemPerformance.brandingCompliance, 95)}`}>
                  {analyticsData.systemPerformance.brandingCompliance}%
                </div>
                {getKpiIcon(analyticsData.systemPerformance.brandingCompliance, 95)}
              </div>
              <p className="text-xs text-muted-foreground">
                Target: 95% | Current: {analyticsData.systemPerformance.brandingCompliance}%
              </p>
              <Progress 
                value={analyticsData.systemPerformance.brandingCompliance} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`text-2xl font-bold ${getKpiColor(analyticsData.systemPerformance.averageScore, 85)}`}>
                  {analyticsData.systemPerformance.averageScore}%
                </div>
                {getKpiIcon(analyticsData.systemPerformance.averageScore, 85)}
              </div>
              <p className="text-xs text-muted-foreground">
                Target: 85% | Current: {analyticsData.systemPerformance.averageScore}%
              </p>
              <Progress 
                value={analyticsData.systemPerformance.averageScore} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shunting Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-blue-600">
                  ₹{analyticsData.systemPerformance.shuntingCost}
                </div>
                <TrendingDown className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground">
                Target: &lt; ₹200 | Current: ₹{analyticsData.systemPerformance.shuntingCost}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Alerts */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Performance Alerts
            </CardTitle>
            <CardDescription>Active performance alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Critical Performance Alerts */}
              <div className="space-y-3">
                <h4 className="font-semibold text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Critical Alerts
                </h4>
                 {analyticsData.performanceAlerts
                   .filter(alert => alert.type === 'critical')
                   .slice(0, 3)
                   .map((alert) => (
                     <div key={alert.id} className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950">
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <h5 className="font-medium text-red-800 dark:text-red-200 text-sm">{alert.title || 'Critical Alert'}</h5>
                           <p className="text-xs text-red-600 dark:text-red-400 mt-1">{alert.message}</p>
                           <div className="flex items-center gap-2 mt-2">
                             <Badge size="sm" className="bg-red-100 text-red-800">
                               Critical
                             </Badge>
                             <span className="text-xs text-red-600 dark:text-red-400">
                               {new Date(alert.timestamp).toLocaleDateString()}
                             </span>
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
              </div>

              {/* Warning Performance Alerts */}
              <div className="space-y-3">
                <h4 className="font-semibold text-yellow-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Warning Alerts
                </h4>
                 {analyticsData.performanceAlerts
                   .filter(alert => alert.type === 'warning')
                   .slice(0, 3)
                   .map((alert) => (
                     <div key={alert.id} className="p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <h5 className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">{alert.title || 'Warning Alert'}</h5>
                           <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{alert.message}</p>
                           <div className="flex items-center gap-2 mt-2">
                             <Badge size="sm" className="bg-yellow-100 text-yellow-800">
                               Warning
                             </Badge>
                             <span className="text-xs text-yellow-600 dark:text-yellow-400">
                               {new Date(alert.timestamp).toLocaleDateString()}
                             </span>
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
              </div>
            </div>

            {/* Performance Alert Summary */}
            <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">Alert Summary</span>
                </div>
                 <div className="flex items-center gap-4 text-sm text-blue-600 dark:text-blue-400">
                   <span>{analyticsData.performanceAlerts.filter(a => a.type === 'critical').length} Critical</span>
                   <span>{analyticsData.performanceAlerts.filter(a => a.type === 'warning').length} Warnings</span>
                   <span>{analyticsData.performanceAlerts.filter(a => !a.resolved).length} Active</span>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Trends</h2>
        <p className="text-muted-foreground mb-6">Historical performance trends and fleet distribution analysis</p>
        
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
            <TabsTrigger value="fleet">Fleet Distribution</TabsTrigger>
            <TabsTrigger value="energy">Energy Consumption</TabsTrigger>
            <TabsTrigger value="alerts">Performance Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Punctuality Trend</CardTitle>
                  <CardDescription>7-day punctuality performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.trends.punctuality}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Energy Efficiency Trend</CardTitle>
                  <CardDescription>7-day energy efficiency performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.trends.energyEfficiency}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mileage Balance Trend</CardTitle>
                  <CardDescription>7-day mileage balancing performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.trends.mileageBalance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Branding Compliance Trend</CardTitle>
                  <CardDescription>7-day branding compliance performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.trends.brandingCompliance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fleet" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Distribution</CardTitle>
                <CardDescription>Current fleet allocation across different zones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.fleetDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.fleetDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="energy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Energy Consumption</CardTitle>
                <CardDescription>Hourly energy consumption pattern</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData.energyConsumption}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="consumption" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Alerts</CardTitle>
                <CardDescription>Recent system alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.insightsList.filter(insight => insight.type === 'critical' || insight.type === 'warning').slice(0, 5).map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                      alert.type === 'critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getInsightIcon(alert.type)}
                          <span className="font-medium">{alert.title}</span>
                        </div>
                        <Badge className={getInsightTypeColor(alert.type)}>
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
