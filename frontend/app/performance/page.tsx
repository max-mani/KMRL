"use client"

import { useState, useEffect } from "react"
import GATracker from "@/components/ga-tracker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, TrendingDown, Clock, Zap, Target, AlertCircle } from "lucide-react"

interface PerformanceMetrics {
  kpis: {
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
  alerts: Array<{
    id: string
    type: 'warning' | 'critical' | 'info'
    message: string
    timestamp: string
    resolved: boolean
  }>
}

export default function PerformancePage() {
  const [hasUser, setHasUser] = useState<boolean>(false)
  const [hasResults, setHasResults] = useState<boolean>(true)
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics>({
    kpis: {
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
    energyConsumption: [],
    alerts: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const user = localStorage.getItem('kmrl-user')
      setHasUser(!!user)
      // Don't require optimization results for performance data - API has its own data
      setHasResults(true)
    } catch {}

    const fetchPerformanceData = async () => {
      try {
        const token = localStorage.getItem('kmrl-token')
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch('http://localhost:3001/api/performance/metrics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setPerformanceData(data.data)
          } else {
            console.error('API returned error:', data.message)
          }
        } else {
          console.error('Failed to fetch performance data:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Error fetching performance data:', error)
        // Fallback to localStorage data if API fails
        try {
          const raw = localStorage.getItem('kmrl-optimization-results')
          const results: any[] = raw ? JSON.parse(raw) : []
          const scores = results.map(r => Number(r.score) || 0)
          const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
          const running = results.filter(r => Number(r.score) >= 65).length
          const standby = results.filter(r => Number(r.score) >= 50 && Number(r.score) < 65).length
          const maintenance = results.filter(r => Number(r.score) < 50).length
          setPerformanceData({
            kpis: {
              punctuality: 0,
              energyEfficiency: 0,
              mileageBalance: 0,
              brandingCompliance: 0,
              averageScore: avg,
              shuntingCost: 0
            },
            trends: { punctuality: [], energyEfficiency: [], mileageBalance: [], brandingCompliance: [] },
            fleetDistribution: [
              { name: 'Running', value: running, color: '#10b981' },
              { name: 'Standby', value: standby, color: '#f59e0b' },
              { name: 'Maintenance', value: maintenance, color: '#ef4444' }
            ],
            energyConsumption: [],
            alerts: []
          })
        } catch (fallbackError) {
          console.error('Fallback data loading failed:', fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPerformanceData()
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

  if (!hasUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="mb-2">You must be logged in to view System Performance.</p>
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
      <GATracker page="performance" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Performance</h1>
        <p className="text-muted-foreground">
          Monitor key performance indicators, energy consumption, and fleet optimization metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Punctuality</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`text-2xl font-bold ${getKpiColor(performanceData.kpis.punctuality, 99)}`}>
                {performanceData.kpis.punctuality}%
              </div>
              {getKpiIcon(performanceData.kpis.punctuality, 99)}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: 99.5% | Current: {performanceData.kpis.punctuality}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`text-2xl font-bold ${getKpiColor(performanceData.kpis.energyEfficiency, 90)}`}>
                {performanceData.kpis.energyEfficiency}%
              </div>
              {getKpiIcon(performanceData.kpis.energyEfficiency, 90)}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: 90% | Current: {performanceData.kpis.energyEfficiency}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mileage Balance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`text-2xl font-bold ${getKpiColor(performanceData.kpis.mileageBalance, 90)}`}>
                {performanceData.kpis.mileageBalance}%
              </div>
              {getKpiIcon(performanceData.kpis.mileageBalance, 90)}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: 90% | Current: {performanceData.kpis.mileageBalance}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Branding Compliance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`text-2xl font-bold ${getKpiColor(performanceData.kpis.brandingCompliance, 95)}`}>
                {performanceData.kpis.brandingCompliance}%
              </div>
              {getKpiIcon(performanceData.kpis.brandingCompliance, 95)}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: 95% | Current: {performanceData.kpis.brandingCompliance}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`text-2xl font-bold ${getKpiColor(performanceData.kpis.averageScore, 85)}`}>
                {performanceData.kpis.averageScore}%
              </div>
              {getKpiIcon(performanceData.kpis.averageScore, 85)}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: 85% | Current: {performanceData.kpis.averageScore}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shunting Cost</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-blue-600">
                ₹{performanceData.kpis.shuntingCost}
              </div>
              <TrendingDown className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground">
              Target: &lt; ₹200 | Current: ₹{performanceData.kpis.shuntingCost}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tabs */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
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
                  <LineChart data={performanceData.trends.punctuality}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
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
                  <LineChart data={performanceData.trends.energyEfficiency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
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
                  <LineChart data={performanceData.trends.mileageBalance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
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
                  <LineChart data={performanceData.trends.brandingCompliance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
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
                      data={performanceData.fleetDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {performanceData.fleetDistribution.map((entry, index) => (
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
                <BarChart data={performanceData.energyConsumption}>
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
          <div className="space-y-4">
            {performanceData.alerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${
                alert.type === 'critical' ? 'border-red-500' : 
                alert.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`h-4 w-4 ${
                        alert.type === 'critical' ? 'text-red-500' : 
                        alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <CardTitle className="text-sm">{alert.message}</CardTitle>
                    </div>
                    <Badge className={
                      alert.resolved ? 'bg-green-100 text-green-800' : 
                      alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {alert.resolved ? 'Resolved' : alert.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
