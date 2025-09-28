"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrainDetail } from "@/components/train-detail"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Train, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Upload,
  Download,
  RefreshCw
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

// Mock auth guard
function Protected({ children }: { children: React.ReactNode }) {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("kmrl-user")
    if (!user) {
      return (
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="mb-2">You must be logged in to view the dashboard.</p>
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

// Enhanced mock data with six-factor analysis
const fleetData = [
  { status: "Running", count: 18, color: "#10B981" },
  { status: "Standby", count: 6, color: "#F59E0B" },
  { status: "Maintenance", count: 4, color: "#EF4444" },
]

const kpiData = [
  { day: "Mon", mileage: 420, energy: 92, punctuality: 98.5, branding: 85 },
  { day: "Tue", mileage: 480, energy: 88, punctuality: 99.2, branding: 78 },
  { day: "Wed", mileage: 455, energy: 95, punctuality: 99.8, branding: 92 },
  { day: "Thu", mileage: 500, energy: 90, punctuality: 98.9, branding: 88 },
  { day: "Fri", mileage: 530, energy: 87, punctuality: 99.1, branding: 85 },
]

// Mock train data with six-factor scoring
const trainData = [
  { 
    id: "T001", 
    name: "Train 001", 
    status: "running", 
    score: 85,
    factors: {
      fitness: { score: 95, status: "great" },
      jobCard: { score: 80, status: "good" },
      branding: { score: 65, status: "ok" },
      mileage: { score: 90, status: "great" },
      cleaning: { score: 75, status: "good" },
      geometry: { score: 70, status: "ok" }
    },
    reason: "Excellent fitness certificate and mileage balancing, but branding wrap is overdue"
  },
  { 
    id: "T002", 
    name: "Train 002", 
    status: "standby", 
    score: 72,
    factors: {
      fitness: { score: 85, status: "good" },
      jobCard: { score: 70, status: "ok" },
      branding: { score: 45, status: "bad" },
      mileage: { score: 80, status: "good" },
      cleaning: { score: 65, status: "ok" },
      geometry: { score: 75, status: "good" }
    },
    reason: "Good overall condition but branding wrap is critical and needs immediate attention"
  },
  { 
    id: "T003", 
    name: "Train 003", 
    status: "maintenance", 
    score: 45,
    factors: {
      fitness: { score: 30, status: "bad" },
      jobCard: { score: 40, status: "bad" },
      branding: { score: 60, status: "ok" },
      mileage: { score: 50, status: "ok" },
      cleaning: { score: 35, status: "bad" },
      geometry: { score: 55, status: "ok" }
    },
    reason: "Multiple critical issues: fitness certificate expired, job card overdue, cleaning required"
  },
  { 
    id: "T004", 
    name: "Train 004", 
    status: "running", 
    score: 92,
    factors: {
      fitness: { score: 98, status: "great" },
      jobCard: { score: 95, status: "great" },
      branding: { score: 90, status: "great" },
      mileage: { score: 88, status: "good" },
      cleaning: { score: 95, status: "great" },
      geometry: { score: 90, status: "great" }
    },
    reason: "Excellent condition across all factors - optimal for revenue service"
  },
  { 
    id: "T005", 
    name: "Train 005", 
    status: "standby", 
    score: 68,
    factors: {
      fitness: { score: 70, status: "ok" },
      jobCard: { score: 75, status: "good" },
      branding: { score: 80, status: "good" },
      mileage: { score: 60, status: "ok" },
      cleaning: { score: 65, status: "ok" },
      geometry: { score: 70, status: "ok" }
    },
    reason: "Average condition across all factors - suitable for standby duty"
  }
]

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

export default function DashboardPage() {
  const [selectedTrain, setSelectedTrain] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <Protected>
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-balance" style={{ color: "var(--kmrl-teal)" }}>
              KMRL Fleet Optimization Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor Fleet Status, Maintenance, Performance, Critical Insights, and Historical Data.
          </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="fleet" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="fleet">Fleet Status</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="performance">System Performance</TabsTrigger>
            <TabsTrigger value="insights">Critical Insights</TabsTrigger>
            <TabsTrigger value="history">Historical Data</TabsTrigger>
          </TabsList>

          <TabsContent value="fleet" className="space-y-6">
            {/* Fleet Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Running</p>
                      <p className="text-2xl font-bold text-green-700">18</p>
                    </div>
                    <Train className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Standby</p>
                      <p className="text-2xl font-bold text-yellow-700">6</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Maintenance</p>
                      <p className="text-2xl font-bold text-red-700">4</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fleet Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fleetData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--kmrl-teal)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Train Rankings (0-100 Scale)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trainData.slice(0, 5).map((train, index) => (
                    <div key={train.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <p className="font-semibold">{train.name}</p>
                          <p className="text-sm text-muted-foreground">{train.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: "var(--kmrl-teal)" }}>
                          {train.score}
                        </p>
                        <Progress value={train.score} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Six-Factor Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Six-Factor Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(factorLabels).map(([key, label]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-3">{label}</h4>
                      <div className="space-y-2">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                { title: "Routine", pending: 3, inProgress: 2, completed: 5, color: "blue" },
                { title: "Inspection", pending: 1, inProgress: 3, completed: 4, color: "yellow" },
                { title: "Repair", pending: 2, inProgress: 1, completed: 2, color: "red" }
              ].map(({ title, pending, inProgress, completed, color }) => (
              <Card key={title}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {title === "Routine" && <CheckCircle className="h-5 w-5 text-blue-600" />}
                      {title === "Inspection" && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                      {title === "Repair" && <AlertTriangle className="h-5 w-5 text-red-600" />}
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pending</span>
                      <Badge variant="outline">{pending}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">In Progress</span>
                      <Badge variant="secondary">{inProgress}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completed</span>
                      <Badge variant="default">{completed}</Badge>
                    </div>
                    <div className="pt-2">
                      <Progress value={(completed / (pending + inProgress + completed)) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((completed / (pending + inProgress + completed)) * 100)}% completion rate
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Maintenance Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Maintenance Schedule</CardTitle>
                </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { train: "T001", type: "Routine", due: "Today", priority: "high" },
                    { train: "T003", type: "Repair", due: "Tomorrow", priority: "critical" },
                    { train: "T005", type: "Inspection", due: "Dec 15", priority: "medium" },
                    { train: "T007", type: "Routine", due: "Dec 16", priority: "low" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          item.priority === "critical" ? "destructive" :
                          item.priority === "high" ? "default" : "secondary"
                        }>
                          {item.priority}
                        </Badge>
                        <div>
                          <p className="font-semibold">{item.train}</p>
                          <p className="text-sm text-muted-foreground">{item.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.due}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Punctuality</p>
                      <p className="text-2xl font-bold text-blue-700">99.5%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Mileage</p>
                      <p className="text-2xl font-bold text-green-700">2,385 km</p>
                    </div>
                    <Train className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Branding</p>
                      <p className="text-2xl font-bold text-yellow-700">85%</p>
                    </div>
                    <Zap className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Energy</p>
                      <p className="text-2xl font-bold text-purple-700">92%</p>
                    </div>
                    <Zap className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Timing KPI (Mileage)</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kpiData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="mileage" stroke="var(--kmrl-teal)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Energy Efficiency</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={[
                        { name: "Regenerative", value: 45 },
                        { name: "Cruise", value: 30 },
                        { name: "Dwell", value: 25 },
                      ]}
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {["var(--kmrl-teal)", "var(--kmrl-accent)", "var(--kmrl-success)"].map((c, i) => (
                        <Cell key={i} fill={c} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            </div>

            {/* Branding Compliance Tracker */}
            <Card>
              <CardHeader>
                <CardTitle>Branding Compliance Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { train: "T001", advertiser: "Coca Cola", hours: 120, target: 150, status: "on-track" },
                    { train: "T002", advertiser: "McDonald's", hours: 45, target: 100, status: "behind" },
                    { train: "T003", advertiser: "Nike", hours: 200, target: 200, status: "completed" },
                    { train: "T004", advertiser: "Samsung", hours: 80, target: 120, status: "on-track" }
                  ].map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{item.train}</p>
                          <p className="text-sm text-muted-foreground">{item.advertiser}</p>
                        </div>
                        <Badge variant={
                          item.status === "completed" ? "default" :
                          item.status === "on-track" ? "secondary" : "destructive"
                        }>
                          {item.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{item.hours} / {item.target} hours</span>
                          <span>{Math.round((item.hours / item.target) * 100)}%</span>
                        </div>
                        <Progress value={(item.hours / item.target) * 100} className="h-2" />
                      </div>
                </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* Critical Issues Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Critical Issues</p>
                      <p className="text-2xl font-bold text-red-700">3</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Warnings</p>
                      <p className="text-2xl font-bold text-yellow-700">7</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Resolved</p>
                      <p className="text-2xl font-bold text-green-700">12</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Critical Train Issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { 
                      train: "T003", 
                      issue: "Fitness Certificate Expired", 
                      severity: "critical",
                      description: "Certificate expired 2 days ago - immediate action required",
                      action: "Schedule emergency inspection"
                    },
                    { 
                      train: "T007", 
                      issue: "Job Card Overdue", 
                      severity: "high",
                      description: "Maintenance job card overdue by 3 days",
                      action: "Complete pending maintenance tasks"
                    },
                    { 
                      train: "T002", 
                      issue: "Branding Wrap Critical", 
                      severity: "medium",
                      description: "Branding wrap due for renewal - SLA at risk",
                      action: "Schedule branding wrap within 48 hours"
                    }
                  ].map((item, index) => (
                    <Alert key={index} className={
                      item.severity === "critical" ? "border-red-200 bg-red-50" :
                      item.severity === "high" ? "border-orange-200 bg-orange-50" :
                      "border-yellow-200 bg-yellow-50"
                    }>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{item.train}</span>
                            <Badge variant={
                              item.severity === "critical" ? "destructive" :
                              item.severity === "high" ? "default" : "secondary"
                            }>
                              {item.severity}
                            </Badge>
                          </div>
                          <p className="font-medium">{item.issue}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <p className="text-sm font-medium text-blue-600">{item.action}</p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Predictive Maintenance Heatmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { train: "T001", risk: "low", nextService: "15 days", components: ["Brake pads", "HVAC"] },
                      { train: "T002", risk: "medium", nextService: "8 days", components: ["Bogie", "Signalling"] },
                      { train: "T003", risk: "high", nextService: "2 days", components: ["Fitness", "Job Card"] },
                      { train: "T004", risk: "low", nextService: "20 days", components: ["Cleaning"] }
                    ].map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{item.train}</span>
                          <Badge variant={
                            item.risk === "high" ? "destructive" :
                            item.risk === "medium" ? "default" : "secondary"
                          }>
                            {item.risk} risk
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Next service: {item.nextService}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.components.map((component, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {component}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Historical Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Yesterday</p>
                      <p className="text-2xl font-bold text-blue-700">480 km</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Today</p>
                      <p className="text-2xl font-bold text-green-700">530 km</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-700" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Change</p>
                      <p className="text-2xl font-bold text-purple-700">+10.4%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Yesterday vs Today (Mileage)</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                        { label: "Yesterday", mileage: 480, punctuality: 98.5 },
                        { label: "Today", mileage: 530, punctuality: 99.2 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="mileage" fill="var(--kmrl-teal)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Branding Completion</CardTitle>
              </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>68%</span>
                    </div>
                    <Progress value={68} className="h-3" />
                  </div>
                  <div className="space-y-3">
                    {[
                      { advertiser: "Coca Cola", progress: 85, status: "on-track" },
                      { advertiser: "McDonald's", progress: 45, status: "behind" },
                      { advertiser: "Nike", progress: 100, status: "completed" },
                      { advertiser: "Samsung", progress: 67, status: "on-track" }
                    ].map((item, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.advertiser}</span>
                          <span>{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Historical Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>7-Day Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { metric: "Average Score", yesterday: 78, today: 82, change: "+5.1%" },
                    { metric: "Running Trains", yesterday: 16, today: 18, change: "+12.5%" },
                    { metric: "Maintenance", yesterday: 6, today: 4, change: "-33.3%" },
                    { metric: "Energy Efficiency", yesterday: 88, today: 92, change: "+4.5%" }
                  ].map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">{item.metric}</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Yesterday</span>
                          <span>{item.yesterday}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Today</span>
                          <span>{item.today}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Change</span>
                          <span className={
                            item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                          }>
                            {item.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </Protected>
  )
}
