"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Factor = {
  name: string
  value: number // 0-100
  color: "green" | "teal" | "yellow" | "red"
}

export function TrainDetail({
  trainId = "KMRL-001",
  score = 84,
  factors = [
    { name: "Fitness Certificate", value: 90, color: "green" },
    { name: "Job-Card Status", value: 75, color: "teal" },
    { name: "Branding Priority", value: 65, color: "yellow" },
    { name: "Mileage Balancing", value: 82, color: "teal" },
    { name: "Cleaning & Detailing", value: 58, color: "yellow" },
    { name: "Stabling Geometry", value: 40, color: "red" },
  ] as Factor[],
}) {
  const colorMap: Record<Factor["color"], string> = {
    green: "var(--kmrl-success)",
    teal: "var(--kmrl-teal)",
    yellow: "var(--kmrl-accent)",
    red: "var(--kmrl-error)",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <span>Train Detail — {trainId}</span>
          <span className="text-xl font-semibold" style={{ color: "var(--kmrl-teal)" }}>
            Optimization Score: {score}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {factors.map((f) => (
          <div key={f.name}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{f.name}</span>
              <span className="text-muted-foreground">{f.value}</span>
            </div>
            <div className="h-2 rounded bg-muted">
              <div className="h-2 rounded" style={{ width: `${f.value}%`, backgroundColor: colorMap[f.color] }} />
            </div>
          </div>
        ))}
        <div className="text-xs text-muted-foreground pt-1">
          Legend: Great (green), Good (teal), OK (yellow), Bad (red)
        </div>
      </CardContent>
    </Card>
  )
}
