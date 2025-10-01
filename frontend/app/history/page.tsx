"use client"

import { useState, useEffect } from "react"
import GATracker from "@/components/ga-tracker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from "recharts"
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Zap, 
  Target, 
  BarChart3,
  Download,
  Filter,
  Search
} from "lucide-react"

interface HistoricalData {
  optimizationHistory: Array<{
    date: string
    totalTrains: number
    serviceTrains: number
    standbyTrains: number
    maintenanceTrains: number
    averageScore: number
    energyEfficiency: number
    punctuality: number
    brandingCompliance: number
    shuntingCost: number
  }>
  performanceTrends: Array<{
    date: string
    punctuality: number
    energyEfficiency: number
    mileageBalance: number
    brandingCompliance: number
  }>
  maintenanceHistory: Array<{
    date: string
    routineMaintenance: number
    inspections: number
    repairs: number
    totalCost: number
  }>
  energyConsumption: Array<{
    date: string
    dailyConsumption: number
    peakHours: number
    offPeakHours: number
    shuntingEnergy: number
  }>
}

interface ComparisonData {
  today: any
  yesterday: any
  lastWeek: any
  lastMonth: any
  changes: {
    averageScoreChange: number
    punctualityChange: number
    energyEfficiencyChange: number
    costChange: number
  }
}

export default function HistoryPage() {
  const [hasUser, setHasUser] = useState<boolean>(false)
  const [hasResults, setHasResults] = useState<boolean>(true)
  const [historicalData, setHistoricalData] = useState<HistoricalData>({
    optimizationHistory: [],
    performanceTrends: [],
    maintenanceHistory: [],
    energyConsumption: []
  })
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const user = localStorage.getItem('kmrl-user')
      setHasUser(!!user)
      const results = localStorage.getItem('kmrl-optimization-results')
      setHasResults(!!results)
    } catch {}

    const fetchHistoricalData = async () => {
      try {
        // derive simple history snapshot from uploaded results
        const raw = localStorage.getItem('kmrl-optimization-results')
        const results: any[] = raw ? JSON.parse(raw) : []
        const avg = results.length ? Math.round(results.reduce((s, r) => s + (Number(r.score) || 0), 0) / results.length) : 0
        const service = results.filter(r => (r.inductionStatus || '').toLowerCase() === 'revenue').length
        const standby = results.filter(r => (r.inductionStatus || '').toLowerCase() === 'standby').length
        const maintenance = results.filter(r => (r.inductionStatus || '').toLowerCase() === 'maintenance').length
        const today = new Date().toISOString().slice(0, 10)
        setHistoricalData({
          optimizationHistory: [{ date: today, totalTrains: results.length, serviceTrains: service, standbyTrains: standby, maintenanceTrains: maintenance, averageScore: avg, energyEfficiency: 0, punctuality: 0, brandingCompliance: 0, shuntingCost: 0 }],
          performanceTrends: [{ date: today, punctuality: 0, energyEfficiency: 0, mileageBalance: 0, brandingCompliance: 0 }],
          maintenanceHistory: [{ date: today, routineMaintenance: 0, inspections: 0, repairs: maintenance, totalCost: 0 }],
          energyConsumption: [{ date: today, dailyConsumption: 0, peakHours: 0, offPeakHours: 0, shuntingEnergy: 0 }]
        })
        setComparisonData({
          today: { averageScore: avg, punctuality: 0, energyEfficiency: 0, cost: 0 },
          yesterday: { averageScore: avg, punctuality: 0, energyEfficiency: 0, cost: 0 },
          lastWeek: { averageScore: avg, punctuality: 0, energyEfficiency: 0, cost: 0 },
          lastMonth: { averageScore: avg, punctuality: 0, energyEfficiency: 0, cost: 0 },
          changes: { averageScoreChange: 0, punctualityChange: 0, energyEfficiencyChange: 0, costChange: 0 }
        })
      } catch (error) {
        console.error('Error fetching historical data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistoricalData()
  }, [selectedPeriod])

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <BarChart3 className="h-4 w-4 text-gray-600" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (!hasUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="mb-2">You must be logged in to view Historical Data.</p>
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
      <GATracker page="history" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Historical Data</h1>
        <p className="text-muted-foreground">
          Analyze historical performance trends and optimization outcomes
        </p>
      </div>

      {/* Comparison Overview */}
      {comparisonData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-blue-500 bg-blue-50/40 dark:bg-blue-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">{comparisonData.today.averageScore}%</div>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(comparisonData.changes.averageScoreChange)}
                  <span className={`text-sm ${getChangeColor(comparisonData.changes.averageScoreChange)}`}>
                    {Math.abs(comparisonData.changes.averageScoreChange)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                vs yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-500 bg-green-50/40 dark:bg-green-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Punctuality</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">{comparisonData.today.punctuality}%</div>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(comparisonData.changes.punctualityChange)}
                  <span className={`text-sm ${getChangeColor(comparisonData.changes.punctualityChange)}`}>
                    {Math.abs(comparisonData.changes.punctualityChange)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                vs yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-amber-500 bg-amber-50/40 dark:bg-amber-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Energy Efficiency</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">{comparisonData.today.energyEfficiency}%</div>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(comparisonData.changes.energyEfficiencyChange)}
                  <span className={`text-sm ${getChangeColor(comparisonData.changes.energyEfficiencyChange)}`}>
                    {Math.abs(comparisonData.changes.energyEfficiencyChange)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                vs yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-purple-500 bg-purple-50/40 dark:bg-purple-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shunting Cost</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">₹{comparisonData.today.cost}</div>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(comparisonData.changes.costChange)}
                  <span className={`text-sm ${getChangeColor(comparisonData.changes.costChange)}`}>
                    ₹{Math.abs(comparisonData.changes.costChange)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                vs yesterday
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              <SelectItem value="optimization">Optimization</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="energy">Energy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Historical Data Tabs */}
      <Tabs defaultValue="optimization" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="energy">Energy</TabsTrigger>
        </TabsList>

        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Distribution Trend</CardTitle>
                <CardDescription>Daily train allocation across service zones</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalData.optimizationHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="serviceTrains" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="standbyTrains" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="maintenanceTrains" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Score Trend</CardTitle>
                <CardDescription>Daily optimization score performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData.optimizationHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="averageScore" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Branding Compliance Trend</CardTitle>
                <CardDescription>Daily branding SLA compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData.optimizationHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="brandingCompliance" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shunting Cost Trend</CardTitle>
                <CardDescription>Daily shunting cost optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={historicalData.optimizationHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="shuntingCost" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics Trend</CardTitle>
              <CardDescription>7-day performance metrics comparison</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                <LineChart data={historicalData.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="punctuality" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} name="Punctuality" />
                  <Line type="monotone" dataKey="energyEfficiency" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} name="Energy Efficiency" />
                  <Line type="monotone" dataKey="mileageBalance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} name="Mileage Balance" />
                  <Line type="monotone" dataKey="brandingCompliance" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} name="Branding Compliance" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Activity Trend</CardTitle>
              <CardDescription>Daily maintenance activities and costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={historicalData.maintenanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="routineMaintenance" stackId="a" fill="#3b82f6" name="Routine" />
                    <Bar dataKey="inspections" stackId="a" fill="#f59e0b" name="Inspections" />
                    <Bar dataKey="repairs" stackId="a" fill="#ef4444" name="Repairs" />
                  </BarChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={historicalData.maintenanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="totalCost" stroke="#8b5cf6" strokeWidth={2} name="Total Cost (₹)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="energy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Energy Consumption Analysis</CardTitle>
              <CardDescription>Daily energy consumption patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={historicalData.energyConsumption}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="peakHours" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Peak Hours" />
                  <Area type="monotone" dataKey="offPeakHours" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Off-Peak Hours" />
                  <Area type="monotone" dataKey="shuntingEnergy" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Shunting Energy" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
