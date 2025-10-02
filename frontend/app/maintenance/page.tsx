"use client"

import { useState, useEffect, useMemo } from "react"
import GATracker from "@/components/ga-tracker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, AlertTriangle, CheckCircle, Wrench, Eye, Search, Filter, PieChart as PieChartIcon } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface MaintenanceData {
  routine: MaintenanceItem[]
  inspection: MaintenanceItem[]
  repair: MaintenanceItem[]
  alerts: MaintenanceAlert[]
}

interface MaintenanceItem {
  id: string
  trainId: string
  trainName: string
  type: 'routine' | 'inspection' | 'repair'
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue'
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  estimatedDuration: number
  description: string
  assignedTo?: string
  progress: number
}

interface MaintenanceAlert {
  id: string
  trainId: string
  type: 'critical' | 'warning' | 'info'
  message: string
  timestamp: string
  resolved: boolean
}

export default function MaintenancePage() {
  const [hasUser, setHasUser] = useState<boolean>(false)
  const [hasResults, setHasResults] = useState<boolean>(true)
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData>({
    routine: [],
    inspection: [],
    repair: [],
    alerts: []
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001')

  useEffect(() => {
    (async () => {
      try {
        const user = localStorage.getItem('kmrl-user')
        setHasUser(!!user)
      } catch {}

      try {
        // Prefer localStorage; if empty, fetch today's results from backend
        let raw = localStorage.getItem('kmrl-optimization-results')
        if (!raw) {
          try {
            const resp = await fetch(`${apiBase}/api/optimization/today`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}`
              }
            })
            if (resp.ok) {
              const data = await resp.json()
              const resultsFromApi = (data?.data?.results || []) as any[]
              if (Array.isArray(resultsFromApi) && resultsFromApi.length) {
                try { localStorage.setItem('kmrl-optimization-results', JSON.stringify(resultsFromApi)) } catch {}
                raw = JSON.stringify(resultsFromApi)
              }
            }
          } catch {}
        }

        const rawNarr = localStorage.getItem('kmrl-optimization-narratives')
        const results: any[] = raw ? JSON.parse(raw) : []
        setHasResults(results.length > 0)
        const narratives: Record<string, string> = rawNarr ? JSON.parse(rawNarr) : {}
        // Try Gemini-backed maintenance prediction endpoint first
        try {
          const resp = await fetch(`${apiBase}/api/maintenance/predict`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}`
            },
            body: JSON.stringify({ results })
          })
          if (resp.ok) {
            const data = await resp.json()
            const tasks = (data?.data?.tasks || []) as any[]
            const alerts = (data?.data?.alerts || []) as any[]
            const mappedTasks: MaintenanceItem[] = tasks.map((t: any, idx: number) => ({
              id: String(idx + 1),
              trainId: t.trainId,
              trainName: t.trainId,
              type: t.type,
              status: t.status,
              priority: t.priority,
              dueDate: t.dueDate,
              estimatedDuration: t.estimatedDuration,
              description: t.description || narratives[t.trainId] || 'Maintenance task',
              assignedTo: t.assignedTo,
              progress: t.progress ?? 0
            }))
            setMaintenanceData({
              routine: mappedTasks.filter(t => t.type === 'routine'),
              inspection: mappedTasks.filter(t => t.type === 'inspection'),
              repair: mappedTasks.filter(t => t.type === 'repair'),
              alerts: (alerts || []).map((a: any, i: number) => ({
                id: String(i + 1),
                trainId: a.trainId,
                type: a.type,
                message: a.message,
                timestamp: a.timestamp,
                resolved: !!a.resolved
              }))
            })
            return
          }
        } catch {}

        // Fallback local derivation if API not available
        const maint = results.filter(r => (r.inductionStatus || '').toLowerCase() === 'maintenance')
        const mapped: MaintenanceItem[] = maint.map((r: any, idx: number) => ({
          id: String(idx + 1),
          trainId: r.trainId || r.id || `T${idx + 1}`,
          trainName: r.trainId || `Train ${idx + 1}`,
          type: 'repair',
          status: 'in-progress',
          priority: 'high',
          dueDate: new Date().toISOString(),
          estimatedDuration: 240,
          description: narratives[(r.trainId || r.id || `T${idx + 1}`)] || r.reason || 'Scheduled corrective maintenance based on optimization results',
          assignedTo: 'Maintenance Team',
          progress: 0
        }))
        setMaintenanceData({
          routine: [],
          inspection: [],
          repair: mapped,
          alerts: mapped.slice(0, 3).map((m, i) => ({
            id: String(i + 1),
            trainId: m.trainId,
            type: 'critical',
            message: m.description,
            timestamp: new Date().toISOString(),
            resolved: false
          }))
        })
      } catch (error) {
        console.error('Error deriving maintenance data:', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // If narratives are missing, try fetching them quickly using existing results
  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem('kmrl-optimization-results')
        const rawNarr = localStorage.getItem('kmrl-optimization-narratives')
        const results: any[] = raw ? JSON.parse(raw) : []
        const existingNarr: Record<string, string> = rawNarr ? JSON.parse(rawNarr) : {}
        const needs = results.filter(r => !existingNarr[r.trainId])
        if (results.length && needs.length) {
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
              }
            })) })
          })
          if (resp.ok) {
            const data = await resp.json()
            const map: Record<string, string> = { ...existingNarr }
            ;(data.narratives || []).forEach((n: any) => { map[n.trainId] = n.narrative })
            localStorage.setItem('kmrl-optimization-narratives', JSON.stringify(map))
            // Rebuild maintenanceData with fresh narratives
            const maint = results.filter(r => (r.inductionStatus || '').toLowerCase() === 'maintenance')
            const mapped: MaintenanceItem[] = maint.map((r: any, idx: number) => ({
              id: String(idx + 1),
              trainId: r.trainId || r.id || `T${idx + 1}`,
              trainName: r.trainId || `Train ${idx + 1}`,
              type: 'repair',
              status: 'in-progress',
              priority: 'high',
              dueDate: new Date().toISOString(),
              estimatedDuration: 240,
              description: map[(r.trainId || r.id || `T${idx + 1}`)] || r.reason || 'Scheduled corrective maintenance based on optimization results',
              assignedTo: 'Maintenance Team',
              progress: 0
            }))
            setMaintenanceData({
              routine: [],
              inspection: [],
              repair: mapped,
              alerts: mapped.slice(0, 3).map((m, i) => ({
                id: String(i + 1),
                trainId: m.trainId,
                type: 'critical',
                message: m.description,
                timestamp: new Date().toISOString(),
                resolved: false
              }))
            })
          }
        }
      } catch {}
    })()
  }, [])

  const filteredData = useMemo(() => {
    const allItems = [...maintenanceData.routine, ...maintenanceData.inspection, ...maintenanceData.repair]
    return allItems.filter(item => {
      const matchesSearch = item.trainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.trainId.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [maintenanceData, searchTerm, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info': return <Eye className="h-5 w-5 text-blue-500" />
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const summaryCounts = useMemo(() => {
    const allItems = [...maintenanceData.routine, ...maintenanceData.inspection, ...maintenanceData.repair]
    return {
      overdue: allItems.filter(item => item.status === 'overdue').length,
      inProgress: allItems.filter(item => item.status === 'in-progress').length,
      scheduled: allItems.filter(item => item.status === 'scheduled').length,
    }
  }, [maintenanceData])

  const statusDistribution = useMemo(() => {
    const allItems = [...maintenanceData.routine, ...maintenanceData.inspection, ...maintenanceData.repair]
    const statuses = ['scheduled', 'in-progress', 'completed', 'overdue']
    const toTitleCase = (s: string) => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    return statuses.map(status => ({
      name: toTitleCase(status),
      value: allItems.filter(item => item.status === status).length
    }))
  }, [maintenanceData])

  const PIE_COLORS = {
    'Scheduled': '#f59e0b',
    'In Progress': '#3b82f6',
    'Completed': '#10b981',
    'Overdue': '#ef4444'
  };

  if (!hasUser) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto">
          <div className="p-8 border rounded-lg text-center">
            <p className="mb-2">You must be logged in to view Maintenance.</p>
            <a href="/login" className="underline" style={{ color: "var(--kmrl-teal)" }}>Go to Login</a>
          </div>
        </div>
      </div>
    )
  }

  if (!hasResults) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto">
          <div className="p-8 border rounded-lg text-center">
            <p className="mb-2">No data found. Please upload data to continue.</p>
            <a href="/upload" className="underline" style={{ color: "var(--kmrl-teal)" }}>Go to Upload</a>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--kmrl-teal)]"></div>
      </div>
    )
  }

  const renderMaintenanceItems = (items: MaintenanceItem[]) => {
    if (items.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No maintenance tasks match your criteria.</p>
    }
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">{item.trainName} <span className="text-sm font-normal text-muted-foreground">({item.trainId})</span></CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`${getStatusColor(item.status)} capitalize`}>{item.status.replace('-', ' ')}</Badge>
                  <Badge className={`${getPriorityColor(item.priority)} capitalize`}>{item.priority}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{item.estimatedDuration} min</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span>{item.assignedTo || 'Unassigned'}</span>
                </div>
              </div>
              {(item.status === 'in-progress' || item.status === 'completed') && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Progress</span>
                    <span>{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full px-4 py-8">
      <GATracker page="maintenance" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Maintenance Hub</h1>
        <p className="text-muted-foreground">
          Oversee and manage all train maintenance, inspections, and repairs.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryCounts.overdue}</div>
            <p className="text-xs text-muted-foreground">Immediate attention required</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryCounts.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently active tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryCounts.scheduled}</div>
            <p className="text-xs text-muted-foreground">Upcoming maintenance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceData.alerts.filter(a => !a.resolved).length}</div>
            <p className="text-xs text-muted-foreground">Unresolved critical issues</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 xl:grid-cols-4 xl:items-start">
        <div className="xl:col-span-3 flex flex-col h-full">
          {/* Critical Alerts */}
      {maintenanceData.alerts.filter(alert => !alert.resolved).length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-500" /> Active Alerts
              </h2>
            <div className="space-y-3 w-full">
                {maintenanceData.alerts.filter(alert => !alert.resolved).map((alert) => (
                <Alert key={alert.id} variant={alert.type === 'critical' ? 'destructive' : 'default'} className="dark:bg-secondary w-full">
                      {getAlertIcon(alert.type)}
                    <AlertDescription className="font-medium text-sm w-full">
                        <strong>{alert.trainId}:</strong> {alert.message}
                      </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-muted/50 dark:bg-muted/20 rounded-lg w-full">
            <div className="relative flex-grow w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by train, ID, or description..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 sm:w-auto w-full">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Maintenance Tabs */}
          <Tabs defaultValue="all" className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All Tasks</TabsTrigger>
              <TabsTrigger value="routine" className="text-xs sm:text-sm">Routine</TabsTrigger>
              <TabsTrigger value="inspection" className="text-xs sm:text-sm">Inspection</TabsTrigger>
              <TabsTrigger value="repair" className="text-xs sm:text-sm">Repair</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6 flex-1">
              {renderMaintenanceItems(filteredData)}
            </TabsContent>
            <TabsContent value="routine" className="mt-6 flex-1">
              {renderMaintenanceItems(filteredData.filter(item => item.type === 'routine'))}
            </TabsContent>
            <TabsContent value="inspection" className="mt-6 flex-1">
              {renderMaintenanceItems(filteredData.filter(item => item.type === 'inspection'))}
            </TabsContent>
            <TabsContent value="repair" className="mt-6 flex-1">
              {renderMaintenanceItems(filteredData.filter(item => item.type === 'repair'))}
            </TabsContent>
          </Tabs>
        </div>

        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Status Distribution
              </CardTitle>
              <CardDescription>Overview of all maintenance tasks by status.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
