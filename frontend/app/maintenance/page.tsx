"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, AlertTriangle, CheckCircle, Wrench, Eye } from "lucide-react"

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
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData>({
    routine: [],
    inspection: [],
    repair: [],
    alerts: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call to fetch maintenance data
    const fetchMaintenanceData = async () => {
      try {
        // Mock data - replace with actual API call
        const mockData: MaintenanceData = {
          routine: [
            {
              id: '1',
              trainId: 'KM01',
              trainName: 'Train KM01',
              type: 'routine',
              status: 'scheduled',
              priority: 'medium',
              dueDate: '2024-01-15',
              estimatedDuration: 120,
              description: 'Regular cleaning and minor inspection',
              assignedTo: 'Maintenance Team A',
              progress: 0
            },
            {
              id: '2',
              trainId: 'KM03',
              trainName: 'Train KM03',
              type: 'routine',
              status: 'in-progress',
              priority: 'low',
              dueDate: '2024-01-14',
              estimatedDuration: 90,
              description: 'Wheel alignment check',
              assignedTo: 'Maintenance Team B',
              progress: 65
            }
          ],
          inspection: [
            {
              id: '3',
              trainId: 'KM07',
              trainName: 'Train KM07',
              type: 'inspection',
              status: 'overdue',
              priority: 'high',
              dueDate: '2024-01-12',
              estimatedDuration: 240,
              description: 'Annual comprehensive inspection',
              assignedTo: 'Inspection Team',
              progress: 0
            },
            {
              id: '4',
              trainId: 'KM12',
              trainName: 'Train KM12',
              type: 'inspection',
              status: 'completed',
              priority: 'medium',
              dueDate: '2024-01-10',
              estimatedDuration: 180,
              description: 'Brake system inspection',
              assignedTo: 'Inspection Team',
              progress: 100
            }
          ],
          repair: [
            {
              id: '5',
              trainId: 'KM15',
              trainName: 'Train KM15',
              type: 'repair',
              status: 'in-progress',
              priority: 'high',
              dueDate: '2024-01-13',
              estimatedDuration: 480,
              description: 'Door mechanism repair',
              assignedTo: 'Repair Team A',
              progress: 40
            }
          ],
          alerts: [
            {
              id: '1',
              trainId: 'KM07',
              type: 'critical',
              message: 'Inspection overdue - immediate attention required',
              timestamp: '2024-01-14T10:30:00Z',
              resolved: false
            },
            {
              id: '2',
              trainId: 'KM15',
              type: 'warning',
              message: 'Repair taking longer than estimated',
              timestamp: '2024-01-14T09:15:00Z',
              resolved: false
            }
          ]
        }
        setMaintenanceData(mockData)
      } catch (error) {
        console.error('Error fetching maintenance data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMaintenanceData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <Eye className="h-4 w-4 text-blue-500" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />
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
        <h1 className="text-3xl font-bold mb-2">Maintenance Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage train maintenance schedules, inspections, and repairs
        </p>
      </div>

      {/* Critical Alerts */}
      {maintenanceData.alerts.filter(alert => !alert.resolved).length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Critical Alerts</h2>
          <div className="space-y-3">
            {maintenanceData.alerts.filter(alert => !alert.resolved).map((alert) => (
              <Alert key={alert.id} className={`border-l-4 ${
                alert.type === 'critical' ? 'border-red-500' : 
                alert.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
              }`}>
                <div className="flex items-center gap-2">
                  {getAlertIcon(alert.type)}
                  <AlertDescription className="font-medium">
                    <strong>{alert.trainId}:</strong> {alert.message}
                  </AlertDescription>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Tabs */}
      <Tabs defaultValue="routine" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="routine">Routine</TabsTrigger>
          <TabsTrigger value="inspection">Inspection</TabsTrigger>
          <TabsTrigger value="repair">Repair</TabsTrigger>
        </TabsList>

        <TabsContent value="routine" className="space-y-4">
          <div className="grid gap-4">
            {maintenanceData.routine.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{item.trainName}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('-', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{item.estimatedDuration} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <span>{item.assignedTo || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span>{item.progress}% complete</span>
                      </div>
                    </div>
                    {item.status === 'in-progress' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inspection" className="space-y-4">
          <div className="grid gap-4">
            {maintenanceData.inspection.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{item.trainName}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('-', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{item.estimatedDuration} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <span>{item.assignedTo || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span>{item.progress}% complete</span>
                      </div>
                    </div>
                    {item.status === 'in-progress' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="repair" className="space-y-4">
          <div className="grid gap-4">
            {maintenanceData.repair.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{item.trainName}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('-', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{item.estimatedDuration} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <span>{item.assignedTo || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span>{item.progress}% complete</span>
                      </div>
                    </div>
                    {item.status === 'in-progress' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
