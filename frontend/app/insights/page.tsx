"use client"

import { useState, useEffect } from "react"
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
    const fetchInsights = async () => {
      try {
        // Mock data - replace with actual API call
        const mockInsights: CriticalInsight[] = [
          {
            id: '1',
            type: 'critical',
            category: 'fitness',
            title: 'Expired Telecom Certificates',
            description: 'Train KM07 and KM12 have expired telecom fitness certificates. This could lead to service interruptions and safety violations.',
            impact: 'high',
            urgency: 'immediate',
            affectedTrains: ['KM07', 'KM12'],
            recommendedActions: [
              'Schedule immediate telecom inspection',
              'Withdraw affected trains from service',
              'Coordinate with telecom department for emergency certification'
            ],
            estimatedSavings: 15000,
            timestamp: '2024-01-14T10:30:00Z',
            resolved: false
          },
          {
            id: '2',
            type: 'warning',
            category: 'branding',
            title: 'Branding SLA at Risk',
            description: 'Train KM03 is falling behind on branding exposure hours. Current completion rate is 45% with only 3 days remaining to meet SLA.',
            impact: 'medium',
            urgency: 'within-24h',
            affectedTrains: ['KM03'],
            recommendedActions: [
              'Prioritize KM03 for service deployment',
              'Extend operating hours if necessary',
              'Coordinate with advertiser for deadline extension'
            ],
            estimatedSavings: 25000,
            timestamp: '2024-01-14T09:15:00Z',
            resolved: false
          },
          {
            id: '3',
            type: 'recommendation',
            category: 'energy',
            title: 'Optimize Shunting Routes',
            description: 'Analysis shows 23% reduction in energy consumption possible by optimizing train movement patterns between service and standby zones.',
            impact: 'medium',
            urgency: 'within-week',
            affectedTrains: ['KM01', 'KM05', 'KM08', 'KM15'],
            recommendedActions: [
              'Implement new shunting algorithm',
              'Update yard layout for shorter routes',
              'Train staff on optimized procedures'
            ],
            estimatedSavings: 8500,
            timestamp: '2024-01-14T08:45:00Z',
            resolved: false
          },
          {
            id: '4',
            type: 'opportunity',
            category: 'efficiency',
            title: 'Predictive Maintenance Window',
            description: 'IoT sensor data indicates optimal maintenance window for Train KM09. Early intervention could prevent 40% more expensive repairs.',
            impact: 'medium',
            urgency: 'within-week',
            affectedTrains: ['KM09'],
            recommendedActions: [
              'Schedule preventive maintenance for KM09',
              'Update maintenance schedules based on sensor data',
              'Implement predictive maintenance protocols'
            ],
            estimatedSavings: 12000,
            timestamp: '2024-01-14T07:30:00Z',
            resolved: false
          },
          {
            id: '5',
            type: 'critical',
            category: 'safety',
            title: 'Critical Brake System Alert',
            description: 'Train KM11 shows abnormal brake pad wear pattern. Immediate inspection required to prevent safety incidents.',
            impact: 'high',
            urgency: 'immediate',
            affectedTrains: ['KM11'],
            recommendedActions: [
              'Immediately withdraw KM11 from service',
              'Emergency brake system inspection',
              'Replace brake pads if necessary'
            ],
            estimatedSavings: 30000,
            timestamp: '2024-01-14T06:20:00Z',
            resolved: false
          },
          {
            id: '6',
            type: 'recommendation',
            category: 'efficiency',
            title: 'Mileage Balancing Opportunity',
            description: 'Current fleet shows uneven mileage distribution. Rebalancing could extend component life by 15% and reduce maintenance costs.',
            impact: 'low',
            urgency: 'within-week',
            affectedTrains: ['KM02', 'KM04', 'KM06', 'KM10', 'KM13', 'KM14'],
            recommendedActions: [
              'Adjust service schedules for better mileage distribution',
              'Implement automated mileage tracking',
              'Create mileage balancing policies'
            ],
            estimatedSavings: 18000,
            timestamp: '2024-01-13T16:45:00Z',
            resolved: false
          }
        ]

        setInsights(mockInsights)
        
        // Calculate metrics
        const newMetrics: InsightMetrics = {
          totalInsights: mockInsights.length,
          criticalCount: mockInsights.filter(i => i.type === 'critical').length,
          warningCount: mockInsights.filter(i => i.type === 'warning').length,
          recommendationCount: mockInsights.filter(i => i.type === 'recommendation').length,
          opportunityCount: mockInsights.filter(i => i.type === 'opportunity').length,
          resolvedCount: mockInsights.filter(i => i.resolved).length,
          pendingCount: mockInsights.filter(i => !i.resolved).length
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
