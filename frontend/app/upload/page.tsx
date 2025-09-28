"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Download,
  RefreshCw,
  BarChart3,
  TrendingUp
} from "lucide-react"
import Papa from "papaparse"
import * as XLSX from "xlsx"

type Row = Record<string, string | number | null | undefined>

// Mock auth guard
function Protected({ children }: { children: React.ReactNode }) {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("kmrl-user")
    if (!user) {
      return (
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="mb-2">You must be logged in to upload data.</p>
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

export default function UploadPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [gSheetUrl, setGSheetUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [optimizationResults, setOptimizationResults] = useState<any[]>([])
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle')

  function onCSV(file: File) {
    setUploadStatus('processing')
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = res.data as Row[]
        setRows(data)
        setHeaders(Object.keys(data[0] || {}))
        setUploadStatus('completed')
        processOptimization(data)
      },
      error: () => {
        setUploadStatus('error')
      }
    })
  }

  async function onXLSX(file: File) {
    setUploadStatus('processing')
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: "array" })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Row>(ws)
      setRows(json)
      setHeaders(Object.keys(json[0] || {}))
      setUploadStatus('completed')
      processOptimization(json)
    } catch (error) {
      setUploadStatus('error')
    }
  }

  async function fetchGSheet() {
    setUploadStatus('processing')
    try {
      const res = await fetch(gSheetUrl)
      const text = await res.text()
      // try parse CSV-like export
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (r) => {
          const data = r.data as Row[]
          setRows(data)
          setHeaders(Object.keys(data[0] || {}))
          setUploadStatus('completed')
          processOptimization(data)
        },
        error: () => {
          setUploadStatus('error')
        }
      })
    } catch (e) {
      console.error(e)
      setUploadStatus('error')
    }
  }

  // Mock optimization processing
  function processOptimization(data: Row[]) {
    setIsProcessing(true)
    setTimeout(() => {
      const results = data.map((row, index) => {
        const trainId = row.trainId || row.train_id || `T${String(index + 1).padStart(3, '0')}`
        const fitness = Math.random() * 100
        const jobCard = Math.random() * 100
        const branding = Math.random() * 100
        const mileage = Math.random() * 100
        const cleaning = Math.random() * 100
        const geometry = Math.random() * 100
        
        const score = Math.round((fitness * 0.25 + jobCard * 0.20 + mileage * 0.20 + geometry * 0.15 + cleaning * 0.10 + branding * 0.10))
        
        return {
          trainId,
          score,
          factors: {
            fitness: { score: Math.round(fitness), status: fitness >= 90 ? 'great' : fitness >= 75 ? 'good' : fitness >= 60 ? 'ok' : 'bad' },
            jobCard: { score: Math.round(jobCard), status: jobCard >= 90 ? 'great' : jobCard >= 75 ? 'good' : jobCard >= 60 ? 'ok' : 'bad' },
            branding: { score: Math.round(branding), status: branding >= 90 ? 'great' : branding >= 75 ? 'good' : branding >= 60 ? 'ok' : 'bad' },
            mileage: { score: Math.round(mileage), status: mileage >= 90 ? 'great' : mileage >= 75 ? 'good' : mileage >= 60 ? 'ok' : 'bad' },
            cleaning: { score: Math.round(cleaning), status: cleaning >= 90 ? 'great' : cleaning >= 75 ? 'good' : cleaning >= 60 ? 'ok' : 'bad' },
            geometry: { score: Math.round(geometry), status: geometry >= 90 ? 'great' : geometry >= 75 ? 'good' : geometry >= 60 ? 'ok' : 'bad' }
          },
          reason: `Optimized based on six-factor analysis: fitness (${Math.round(fitness)}%), job card (${Math.round(jobCard)}%), branding (${Math.round(branding)}%), mileage (${Math.round(mileage)}%), cleaning (${Math.round(cleaning)}%), geometry (${Math.round(geometry)}%)`
        }
      })
      
      setOptimizationResults(results.sort((a, b) => b.score - a.score))
      setIsProcessing(false)
    }, 2000)
  }

  const table = useMemo(() => {
    if (!rows.length) return null
    return (
      <div className="overflow-auto rounded-md border">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((r, i) => (
              <tr key={i} className="even:bg-muted/40">
                {headers.map((h) => (
                  <td key={h} className="px-3 py-2">
                    {String(r[h] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }, [rows, headers])

  return (
    <Protected>
      <section className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold" style={{ color: "var(--kmrl-teal)" }}>
            Data Upload & Optimization
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload CSV, Excel, or Google Sheet data for train induction optimization analysis.
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="upload">Upload Data</TabsTrigger>
            <TabsTrigger value="results">Optimization Results</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Upload Status */}
            {uploadStatus !== 'idle' && (
              <Alert className={
                uploadStatus === 'completed' ? 'border-green-200 bg-green-50' :
                uploadStatus === 'error' ? 'border-red-200 bg-red-50' :
                'border-blue-200 bg-blue-50'
              }>
                {uploadStatus === 'processing' && <RefreshCw className="h-4 w-4 animate-spin" />}
                {uploadStatus === 'completed' && <CheckCircle className="h-4 w-4" />}
                {uploadStatus === 'error' && <AlertTriangle className="h-4 w-4" />}
                <AlertDescription>
                  {uploadStatus === 'processing' && 'Processing your data...'}
                  {uploadStatus === 'completed' && 'Data uploaded successfully! Running optimization...'}
                  {uploadStatus === 'error' && 'Error processing data. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Files
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">CSV Files</label>
                    <Input 
                      type="file" 
                      accept=".csv" 
                      onChange={(e) => e.target.files?.[0] && onCSV(e.target.files[0])}
                      disabled={uploadStatus === 'processing'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Excel Files</label>
                    <Input 
                      type="file" 
                      accept=".xlsx,.xls" 
                      onChange={(e) => e.target.files?.[0] && onXLSX(e.target.files[0])}
                      disabled={uploadStatus === 'processing'}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Google Sheet URL</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Google Sheet CSV export URL"
                      value={gSheetUrl}
                      onChange={(e) => setGSheetUrl(e.target.value)}
                      disabled={uploadStatus === 'processing'}
                    />
                    <Button 
                      onClick={fetchGSheet} 
                      disabled={!gSheetUrl || uploadStatus === 'processing'}
                      style={{ backgroundColor: "var(--kmrl-teal)" }}
                    >
                      Import
                    </Button>
                  </div>
                </div>

                {table}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {isProcessing && (
              <Card>
                <CardContent className="p-6 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: "var(--kmrl-teal)" }} />
                  <h3 className="text-lg font-semibold mb-2">Running Optimization Engine</h3>
                  <p className="text-muted-foreground mb-4">Analyzing six factors for each train...</p>
                  <Progress value={66} className="w-full" />
                </CardContent>
              </Card>
            )}

            {optimizationResults.length > 0 && !isProcessing && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Train Rankings (0-100 Scale)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {optimizationResults.map((result, index) => (
                        <div key={result.trainId} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">#{index + 1}</Badge>
                              <div>
                                <p className="font-semibold">{result.trainId}</p>
                                <p className="text-sm text-muted-foreground">{result.reason}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold" style={{ color: "var(--kmrl-teal)" }}>
                                {result.score}
                              </p>
                              <Progress value={result.score} className="w-20 h-2" />
                            </div>
                          </div>
                          
                          {/* Six-Factor Analysis */}
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3">
                            {Object.entries(result.factors).map(([factor, data]) => (
                              <div key={factor} className="text-center p-2 border rounded">
                                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                                  data.status === 'great' ? 'bg-green-500' :
                                  data.status === 'good' ? 'bg-blue-500' :
                                  data.status === 'ok' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                                <p className="text-xs font-medium">{factor}</p>
                                <p className="text-xs text-muted-foreground">{data.score}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Summary Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total Trains</span>
                          <span className="font-semibold">{optimizationResults.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Score</span>
                          <span className="font-semibold">
                            {Math.round(optimizationResults.reduce((sum, r) => sum + r.score, 0) / optimizationResults.length)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Highest Score</span>
                          <span className="font-semibold text-green-600">
                            {Math.max(...optimizationResults.map(r => r.score))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lowest Score</span>
                          <span className="font-semibold text-red-600">
                            {Math.min(...optimizationResults.map(r => r.score))}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Export Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV Report
                      </Button>
                      <Button className="w-full" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Download Excel Report
                      </Button>
                      <Button className="w-full" style={{ backgroundColor: "var(--kmrl-teal)" }}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Send to Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {optimizationResults.length === 0 && !isProcessing && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
                  <p className="text-muted-foreground">Upload data to see optimization results.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </Protected>
  )
}
