"use client"

import { useMemo, useState, useEffect } from "react"
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

// Mock auth guard with mounted gate to avoid SSR/CSR mismatch
function Protected({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const user = localStorage.getItem("kmrl-user")
      setIsAuthed(!!user)
    } catch {
      setIsAuthed(false)
    }
  }, [])

  if (!mounted || isAuthed === null) return null

  if (!isAuthed) {
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

  return <>{children}</>
}

export default function UploadPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [gSheetUrl, setGSheetUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [optimizationResults, setOptimizationResults] = useState<any[]>([])
  const [narratives, setNarratives] = useState<Record<string, string>>({})
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle')
  const [activeTab, setActiveTab] = useState<'upload' | 'results'>('upload')
  const [categoryFiles, setCategoryFiles] = useState<Record<string, File[]>>({
    fitnessCertificate: [],
    jobCardStatus: [],
    brandingPriority: [],
    mileageBalancing: [],
    cleaningDetailing: [],
    stablingGeometry: []
  })
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001')

  function onCSV(file: File) {
    setUploadStatus('processing')
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res: any) => {
        const data = res.data as Row[]
        setRows(data)
        setHeaders(Object.keys(data[0] || {}))
        setUploadStatus('completed')
        uploadFile(file)
      },
      error: () => {
        setUploadStatus('error')
      }
    })
  }

  async function uploadMultiCategory() {
    setIsProcessing(true)
    setUploadStatus('processing')
    try {
      const form = new FormData()
      ;(Object.keys(categoryFiles) as (keyof typeof categoryFiles)[]).forEach((k) => {
        (categoryFiles[k] || []).forEach((file) => {
          form.append(k, file)
        })
      })

      const response = await fetch(`${apiBase}/api/upload/data/multi`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}`
        },
        body: form
      })

      if (!response.ok) {
        let errMsg = 'Failed to process multi-file optimization'
        try { const e = await response.json(); if (e?.message) errMsg = `${errMsg}: ${e.message}` } catch {}
        throw new Error(errMsg)
      }

      const result = await response.json()
      if (result.success && result.data?.optimizationResults) {
        const optResults = result.data.optimizationResults
        setOptimizationResults(optResults)
        try { localStorage.setItem('kmrl-optimization-results', JSON.stringify(optResults)) } catch {}
        setUploadStatus('completed')
        setActiveTab('results')
        // Fetch narratives
        try {
          const resp = await fetch(`${apiBase}/api/optimization/narrative/trains`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}`
            },
            body: JSON.stringify({ trains: optResults.map((r: any) => ({
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
            const map: Record<string, string> = {}
            ;(data.narratives || []).forEach((n: any) => { map[n.trainId] = n.narrative })
            setNarratives(map)
            try { localStorage.setItem('kmrl-optimization-narratives', JSON.stringify(map)) } catch {}
          }
        } catch {}
      } else {
        throw new Error(result.message || 'Optimization failed')
      }
    } catch (e) {
      console.error(e)
      setUploadStatus('error')
    } finally {
      setIsProcessing(false)
    }
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
      uploadFile(file)
    } catch (error) {
      setUploadStatus('error')
    }
  }

  async function fetchGSheet() {
    setUploadStatus('processing')
    try {
      const resp = await fetch(`${apiBase}/api/upload/google-sheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}`
        },
        body: JSON.stringify({ url: gSheetUrl })
      })
      if (!resp.ok) {
        throw new Error('Failed to import Google Sheet')
      }
      const result = await resp.json()
      // Best-effort: reflect rows/headers from backend originalData if present
      const original = result?.data?.summary?.originalData || result?.data?.originalData || []
      if (Array.isArray(original) && original.length) {
        setRows(original)
        setHeaders(Object.keys(original[0] || {}))
      }
      if (result.success && result.data?.optimizationResults) {
        const optResults = result.data.optimizationResults
        setOptimizationResults(optResults)
        try {
          localStorage.setItem('kmrl-optimization-results', JSON.stringify(optResults))
        } catch {}
        // Fetch narratives
        try {
          const narr = await fetch(`${apiBase}/api/optimization/narrative/trains`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}`
            },
            body: JSON.stringify({ trains: optResults.map((r: any) => ({
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
              },
              ...(typeof r.stablingBay !== 'undefined' ? { stablingBay: r.stablingBay } : {}),
              ...(typeof r.cleaningSlot !== 'undefined' ? { cleaningSlot: r.cleaningSlot } : {}),
            })) })
          })
          if (narr.ok) {
            const data = await narr.json()
            const map: Record<string, string> = {}
            ;(data.narratives || []).forEach((n: any) => { map[n.trainId] = n.narrative })
            setNarratives(map)
            try { localStorage.setItem('kmrl-optimization-narratives', JSON.stringify(map)) } catch {}
          }
        } catch {}
      } else {
        throw new Error(result.message || 'Optimization failed')
      }
      setUploadStatus('completed')
      setActiveTab('results')
    } catch (e) {
      console.error(e)
      setUploadStatus('error')
    }
  }

  async function uploadFile(file: File) {
    setIsProcessing(true)
    try {
      const form = new FormData()
      form.append('file', file)

      const response = await fetch(`${apiBase}/api/upload/data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}`
        },
        body: form
      })

      if (!response.ok) {
        // Try to read error for required columns
        let errMsg = 'Failed to process optimization'
        try { const e = await response.json(); if (e?.message) errMsg = `${errMsg}: ${e.message}${e.missingColumns ? ` (${e.missingColumns.join(', ')})` : ''}` } catch {}
        throw new Error(errMsg)
      }

      const result = await response.json()
      if (result.success && result.data?.optimizationResults) {
        const optResults = result.data.optimizationResults
        setOptimizationResults(optResults)
        try { localStorage.setItem('kmrl-optimization-results', JSON.stringify(optResults)) } catch {}
        // Fetch narratives
        try {
          const resp = await fetch(`${apiBase}/api/optimization/narrative/trains`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}`
            },
            body: JSON.stringify({ trains: optResults.map((r: any) => ({
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
              },
              ...(typeof r.stablingBay !== 'undefined' ? { stablingBay: r.stablingBay } : {}),
              ...(typeof r.cleaningSlot !== 'undefined' ? { cleaningSlot: r.cleaningSlot } : {}),
            })) })
          })
          if (resp.ok) {
            const data = await resp.json()
            const map: Record<string, string> = {}
            ;(data.narratives || []).forEach((n: any) => { map[n.trainId] = n.narrative })
            setNarratives(map)
            try { localStorage.setItem('kmrl-optimization-narratives', JSON.stringify(map)) } catch {}
          }
        } catch {}
        setActiveTab('results')
      } else {
        throw new Error(result.message || 'Optimization failed')
      }
    } catch (error) {
      console.error('Optimization error:', error)
      setOptimizationResults([])
    } finally {
      setIsProcessing(false)
    }
  }

  // Real optimization processing using Python service
  async function processOptimization(data: Row[]) {
    setIsProcessing(true)
    try {
      // Convert data to the format expected by the backend
      const processedData = data.map((row, index) => ({
        trainId: row.trainId || row.train_id || `T${String(index + 1).padStart(3, '0')}`,
        fitnessCertificate: Number(row.fitnessCertificate) || 0,
        jobCardStatus: Number(row.jobCardStatus) || 0,
        brandingPriority: Number(row.brandingPriority) || 0,
        mileageBalancing: Number(row.mileageBalancing) || 0,
        cleaningDetailing: Number(row.cleaningDetailing) || 0,
        stablingGeometry: Number(row.stablingGeometry) || 0
      }))

      // Send data to backend for Python optimization
      const response = await fetch(`${apiBase}/api/upload/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}`
        },
        body: JSON.stringify({ data: processedData })
      })

      if (!response.ok) {
        throw new Error('Failed to process optimization')
      }

      const result = await response.json()
      
      if (result.success && result.data.optimizationResults) {
        const optResults = result.data.optimizationResults
        setOptimizationResults(optResults)
        // Fetch narratives for these trains
        try {
          const resp = await fetch(`${apiBase}/api/optimization/narrative/trains`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}`
            },
            body: JSON.stringify({ trains: optResults.map((r: any) => ({
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
              },
              // optional metadata if present in API result
              ...(typeof r.stablingBay !== 'undefined' ? { stablingBay: r.stablingBay } : {}),
              ...(typeof r.cleaningSlot !== 'undefined' ? { cleaningSlot: r.cleaningSlot } : {}),
            })) })
          })
          if (resp.ok) {
            const data = await resp.json()
            const map: Record<string, string> = {}
            ;(data.narratives || []).forEach((n: any) => { map[n.trainId] = n.narrative })
            setNarratives(map)
            try {
              localStorage.setItem('kmrl-optimization-narratives', JSON.stringify(map))
            } catch {}
          }
        } catch {}
        try {
          localStorage.setItem('kmrl-optimization-results', JSON.stringify(optResults))
        } catch (e) {}
      } else {
        throw new Error(result.message || 'Optimization failed')
      }
    } catch (error) {
      console.error('Optimization error:', error)
      // Fallback to mock data if backend fails
      const results = (data as Row[]).map((row, index) => {
        const trainId = (row as any).trainId || (row as any).train_id || `T${String(index + 1).padStart(3, '0')}`
        const fitness = Number((row as any).fitnessCertificate ?? (((Number((row as any).rolling_stock_fitness)||0)+(Number((row as any).signalling_fitness)||0)+(Number((row as any).telecom_fitness)||0))/3*100)) || 0
        const jobCard = Number((row as any).jobCardStatus ?? (((((row as any).job_card_status||'').toString().toLowerCase()) === 'closed') ? 100 : 0)) || 0
        const branding = Number((row as any).brandingPriority ?? ((Number((row as any).branding_hours)||0) / Math.max(1, Number((row as any).branding_total)||0) * 100)) || 0
        const mileage = Number((row as any).mileageBalancing ?? (100 - (Number((row as any).mileage_balance_deviation)||0)/100)) || 0
        const cleaning = Number((row as any).cleaningDetailing ?? (((Number((row as any).cleaning_slot)||0) > 0) ? 100 : 50)) || 0
        const geometry = Number((row as any).stablingGeometry ?? (((Number((row as any).stabling_bay)||0) > 0) ? 100 : 50)) || 0

        let baseScore = (fitness * 0.25 + jobCard * 0.20 + mileage * 0.20 + geometry * 0.15 + cleaning * 0.10 + branding * 0.10)
        const jitter = ((index * 7) % 7) - 3 // deterministic spread: -3..+3
        const score = Math.max(0, Math.min(100, Math.round(baseScore + jitter)))
        const inductionStatus = score >= 65 ? 'running' : score >= 50 ? 'standby' : 'maintenance'

        return {
          trainId,
          score,
          inductionStatus,
          factors: {
            fitness: { score: Math.round(fitness), status: fitness >= 90 ? 'great' : fitness >= 75 ? 'good' : fitness >= 60 ? 'ok' : 'bad' },
            jobCard: { score: Math.round(jobCard), status: jobCard >= 90 ? 'great' : jobCard >= 75 ? 'good' : jobCard >= 60 ? 'ok' : 'bad' },
            branding: { score: Math.round(branding), status: branding >= 90 ? 'great' : branding >= 75 ? 'good' : branding >= 60 ? 'ok' : 'bad' },
            mileage: { score: Math.round(mileage), status: mileage >= 90 ? 'great' : mileage >= 75 ? 'good' : mileage >= 60 ? 'ok' : 'bad' },
            cleaning: { score: Math.round(cleaning), status: cleaning >= 90 ? 'great' : cleaning >= 75 ? 'good' : cleaning >= 60 ? 'ok' : 'bad' },
            geometry: { score: Math.round(geometry), status: geometry >= 90 ? 'great' : geometry >= 75 ? 'good' : geometry >= 60 ? 'ok' : 'bad' }
          },
          reason: ''
        }
      })
      
      setOptimizationResults(results.sort((a, b) => b.score - a.score))
      // Try to fetch narratives for fallback results
      try {
        const resp = await fetch(`${apiBase}/api/optimization/narrative/trains`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('kmrl-token') || ''}`
          },
          body: JSON.stringify({ trains: results.map(r => ({
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
            },
            // optional metadata if present in derived result
            ...(typeof (r as any).stablingBay !== 'undefined' ? { stablingBay: (r as any).stablingBay } : {}),
            ...(typeof (r as any).cleaningSlot !== 'undefined' ? { cleaningSlot: (r as any).cleaningSlot } : {}),
          })) })
        })
        if (resp.ok) {
          const data = await resp.json()
          const map: Record<string, string> = {}
          ;(data.narratives || []).forEach((n: any) => { map[n.trainId] = n.narrative })
          setNarratives(map)
          try {
            localStorage.setItem('kmrl-optimization-narratives', JSON.stringify(map))
          } catch {}
        }
      } catch {}
      try {
        localStorage.setItem('kmrl-optimization-results', JSON.stringify(results))
      } catch (e) {}
    } finally {
      setIsProcessing(false)
    }
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

  function getResultColorClasses(result: any) {
    try {
      const factors: Record<string, { score: number; status: string }> = result.factors || {}
      const statuses = Object.values(factors).map((f) => (f?.status || 'ok') as string)
      const hasBad = statuses.includes('bad')
      const hasOk = statuses.includes('ok')
      const hasGood = statuses.includes('good')
      const hasGreat = statuses.includes('great')

      // Priority: bad > ok > good > great
      if (hasBad) {
        return { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', score: 'text-red-600 dark:text-red-400' }
      }
      if (hasOk) {
        return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', score: 'text-yellow-600 dark:text-yellow-400' }
      }
      if (hasGood) {
        return { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', score: 'text-blue-600 dark:text-blue-400' }
      }
      if (hasGreat) {
        return { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', score: 'text-green-600 dark:text-green-400' }
      }
    } catch {}
    // Fallback based on score
    const s = Number(result.score) || 0
    if (s >= 80) return { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', score: 'text-green-600 dark:text-green-400' }
    if (s >= 60) return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', score: 'text-yellow-600 dark:text-yellow-400' }
    return { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', score: 'text-red-600 dark:text-red-400' }
  }

  const factorLabelMap: Record<string, string> = {
    fitness: 'Fitness',
    jobCard: 'Job Card',
    branding: 'Branding',
    mileage: 'Mileage',
    cleaning: 'Cleaning',
    geometry: 'Geometry'
  }

  function getStatusChipClasses(status: string) {
    switch ((status || '').toLowerCase()) {
      case 'great':
        return 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
      case 'good':
        return 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
      case 'ok':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
      case 'bad':
        return 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
      default:
        return 'bg-muted text-foreground border dark:bg-muted/30'
    }
  }

  return (
    <Protected>
      <section className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold" style={{ color: "var(--kmrl-teal)" }}>
              Data Upload & Optimization
            </h1>
            <p className="text-sm text-muted-foreground">
              Import data (CSV / Excel / Google Sheet), then schedule optimization to view results.
            </p>
          </div>
          {rows.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden md:inline">{rows.length} rows imported</span>
              <Button
                onClick={() => setActiveTab('results')}
                disabled={isProcessing}
                className="bg-[var(--kmrl-teal)] text-white hover:opacity-90"
              >
                Schedule Optimization
              </Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="upload">Upload Data</TabsTrigger>
            <TabsTrigger value="results" disabled={!optimizationResults.length && !isProcessing}>Optimization Results</TabsTrigger>
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
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category-wise Multiple Files</label>
                    <p className="text-xs text-muted-foreground">Upload multiple CSV/Excel files per category. Supported categories: Fitness Certificate, Job Card Status, Branding Priority, Mileage Balancing, Cleaning & Detailing, Stabling Geometry.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { key: 'fitnessCertificate', label: 'Fitness Certificate' },
                        { key: 'jobCardStatus', label: 'Job Card Status' },
                        { key: 'brandingPriority', label: 'Branding Priority' },
                        { key: 'mileageBalancing', label: 'Mileage Balancing' },
                        { key: 'cleaningDetailing', label: 'Cleaning & Detailing' },
                        { key: 'stablingGeometry', label: 'Stabling Geometry' },
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-1">
                          <label className="text-sm">{label}</label>
                          <Input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || [])
                              setCategoryFiles((prev) => ({ ...prev, [key]: files }))
                            }}
                            disabled={uploadStatus === 'processing'}
                          />
                          {categoryFiles[key]?.length ? (
                            <span className="text-xs text-muted-foreground">{categoryFiles[key].length} file(s) selected</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={uploadMultiCategory} disabled={isProcessing} className="bg-[var(--kmrl-teal)] text-white hover:opacity-90">
                        Upload Multiple Files (Merge & Optimize)
                      </Button>
                    </div>
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
                {rows.length > 0 && (
                  <div className="flex items-center justify-end">
                    <Button onClick={() => setActiveTab('results')} className="bg-[var(--kmrl-teal)] text-white hover:opacity-90">
                      Schedule Optimization
                    </Button>
                  </div>
                )}
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
                  <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Train Rankings (0-100 Scale)
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => setActiveTab('upload')}>Back to Upload</Button>
                      <Button className="bg-[var(--kmrl-teal)] text-white hover:opacity-90" onClick={() => {
                        try { localStorage.setItem('kmrl-optimization-results', JSON.stringify(optimizationResults)) } catch {}
                        window.location.href = '/dashboard'
                      }}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Send to Dashboard
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {optimizationResults.map((result, index) => {
                        const color = getResultColorClasses(result)
                        return (
                        <div key={result.trainId} className={`p-4 border rounded-lg ${color.bg} ${color.border}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">#{index + 1}</Badge>
                              <div>
                                <p className="font-semibold">{result.trainId}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant={result.inductionStatus === 'running' ? 'default' : 
                                            result.inductionStatus === 'standby' ? 'secondary' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {result.inductionStatus?.toUpperCase() || 'UNKNOWN'}
                                  </Badge>
                                  {result.cleaningSlot > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      Cleaning Slot: {result.cleaningSlot}
                                    </Badge>
                                  )}
                                  {result.stablingBay > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      Bay: {result.stablingBay}
                                    </Badge>
                                  )}
                                </div>
                                {/* Colorized factor chips */}
                                {result.factors && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {Object.entries(result.factors as Record<string, { score: number; status: string }>).
                                      map(([k, v]) => (
                                        <span key={k} className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusChipClasses(v.status)}`}>
                                          {factorLabelMap[k] || k}: {Math.round(Number(v.score) || 0)}%
                                        </span>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${color.score}`}>
                                {result.score}
                              </p>
                              <Progress 
                                value={result.score} 
                                className="w-28 h-2"
                                indicatorClassName={
                                  color.score.includes('green') ? 'bg-green-500' :
                                  color.score.includes('blue') ? 'bg-blue-500' :
                                  color.score.includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'
                                }
                                trackClassName="bg-muted"
                              />
                            </div>
                          </div>
                          
                          {/* Six-Factor Analysis */}
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3">
                          {Object.entries(result.factors as Record<string, { score: number; status: string }>).map(([factor, data]) => (
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

                          {/* Narrative explanation */}
                          <div className="mt-3 text-sm text-muted-foreground">
                            {narratives[result.trainId] && (
                              <p>{narratives[result.trainId]}</p>
                            )}
                          </div>
                        </div>
                      )})}
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
                      <Button className="w-full" style={{ backgroundColor: "var(--kmrl-teal)" }} onClick={() => {
                        try {
                          localStorage.setItem('kmrl-optimization-results', JSON.stringify(optimizationResults))
                        } catch {}
                        window.location.href = '/dashboard'
                      }}>
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
