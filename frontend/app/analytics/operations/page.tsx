"use client"

import { useState, useEffect } from "react"
import GATracker from "@/components/ga-tracker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { Zap, DollarSign, Activity, TrendingUp } from "lucide-react"

export default function OperationsAnalytics() {
  const [activeTab, setActiveTab] = useState<string>("branding")
  const [hasUser, setHasUser] = useState<boolean>(false)
  const [brandingData, setBrandingData] = useState(() => (
    [
      { month: 'Jan', expense: 120000 },
      { month: 'Feb', expense: 98000 },
      { month: 'Mar', expense: 134000 },
      { month: 'Apr', expense: 150000 },
      { month: 'May', expense: 125000 },
      { month: 'Jun', expense: 110000 }
    ]
  ))

  const [energyData, setEnergyData] = useState(() => (
    [
      { hour: '00', consumption: 420 },
      { hour: '04', consumption: 360 },
      { hour: '08', consumption: 980 },
      { hour: '12', consumption: 1200 },
      { hour: '16', consumption: 980 },
      { hour: '20', consumption: 600 }
    ]
  ))

  const [shuntingData, setShuntingData] = useState(() => (
    [
      { name: 'Yard A', cost: 42000 },
      { name: 'Yard B', cost: 56000 },
      { name: 'Yard C', cost: 32000 }
    ]
  ))

  useEffect(() => {
    try { const u = localStorage.getItem('kmrl-user'); setHasUser(!!u) } catch {}
  }, [])

  if (!hasUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <p className="mb-2">You must be logged in to view Operations analytics.</p>
            <a href="/login" className="underline" style={{ color: "var(--kmrl-teal)" }}>Go to Login</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
  {/* use 'insights' page id to match allowed GATracker types */}
  <GATracker page="insights" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold" style={{ color: "var(--kmrl-teal)" }}>Operations Analytics</h1>
          <p className="text-sm text-muted-foreground">Branding expense, energy tracking and shunting analysis for Kochi Metro</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList className="mb-4">
          <TabsTrigger value="branding">Branding Expense</TabsTrigger>
          <TabsTrigger value="energy">Energy Tracking</TabsTrigger>
          <TabsTrigger value="shunting">Shunting Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Branding Spend</CardTitle>
              </CardHeader>
              <CardContent className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={brandingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="expense" stroke="var(--kmrl-teal)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between"><span>Station Wraps</span><span className="font-semibold">₹72,000</span></li>
                  <li className="flex items-center justify-between"><span>Platform Banners</span><span className="font-semibold">₹44,000</span></li>
                  <li className="flex items-center justify-between"><span>Train Branding</span><span className="font-semibold">₹86,000</span></li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Budget Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">65%</div>
                  <div className="text-sm text-muted-foreground">of allocated branding budget used</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="energy">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4" /> Energy Consumption</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={energyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="consumption" fill="var(--kmrl-teal)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak vs Off-peak</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2">Peak hours show ~40% higher consumption</p>
                <div className="text-center text-2xl font-bold text-blue-600">Peak: 1200 kWh</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="shunting">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Shunting Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={shuntingData} dataKey="cost" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {shuntingData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={["var(--kmrl-teal)", "var(--kmrl-accent)", "var(--kmrl-success)"][idx % 3]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2"><span className="flex-1">Consolidate shunting in Yard A</span><span className="text-sm text-green-600 font-medium">Save ₹12,000</span></li>
                  <li className="flex items-center gap-2"><span className="flex-1">Night-time electricity negotiation</span><span className="text-sm text-green-600 font-medium">Save ₹20,000</span></li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
