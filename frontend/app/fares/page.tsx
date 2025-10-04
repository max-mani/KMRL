"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const fareZones = [
  { zone: "F1", distance: "2 km", fare: "Rs. 10" },
  { zone: "F2", distance: "5 km", fare: "Rs. 20" },
  { zone: "F3", distance: "10 km", fare: "Rs. 30" },
  { zone: "F4", distance: "15 km", fare: "Rs. 40" },
  { zone: "F5", distance: "20 km", fare: "Rs. 50" },
  { zone: "F6", distance: "25 km", fare: "Rs. 60" }
]

const stationFares = [
  { from: "Aluva", to: "Pulinchodu", fare: "Rs. 10", zone: "F1" },
  { from: "Aluva", to: "Companypadi", fare: "Rs. 10", zone: "F1" },
  { from: "Aluva", to: "Ambattukavu", fare: "Rs. 10", zone: "F1" },
  { from: "Aluva", to: "Muttom", fare: "Rs. 20", zone: "F2" },
  { from: "Aluva", to: "Kalamassery", fare: "Rs. 20", zone: "F2" },
  { from: "Aluva", to: "CUSAT", fare: "Rs. 20", zone: "F2" },
  { from: "Aluva", to: "Pathadipalam", fare: "Rs. 30", zone: "F3" },
  { from: "Aluva", to: "Edapally", fare: "Rs. 30", zone: "F3" },
  { from: "Aluva", to: "Changampuzha Park", fare: "Rs. 30", zone: "F3" },
  { from: "Aluva", to: "Palarivattom", fare: "Rs. 40", zone: "F4" },
  { from: "Aluva", to: "JLN Stadium", fare: "Rs. 40", zone: "F4" },
  { from: "Aluva", to: "Kaloor", fare: "Rs. 40", zone: "F4" },
  { from: "Aluva", to: "Town Hall", fare: "Rs. 50", zone: "F5" },
  { from: "Aluva", to: "MG Road", fare: "Rs. 50", zone: "F5" },
  { from: "Aluva", to: "Maharajas College", fare: "Rs. 50", zone: "F5" },
  { from: "Aluva", to: "Ernakulam South", fare: "Rs. 60", zone: "F6" },
  { from: "Aluva", to: "Kadavanthara", fare: "Rs. 60", zone: "F6" },
  { from: "Aluva", to: "Elamkulam", fare: "Rs. 60", zone: "F6" },
  { from: "Aluva", to: "Vyttila", fare: "Rs. 60", zone: "F6" },
  { from: "Aluva", to: "Thykoodam", fare: "Rs. 60", zone: "F6" },
  { from: "Aluva", to: "Petta", fare: "Rs. 60", zone: "F6" },
  { from: "Aluva", to: "Vadakkekotta", fare: "Rs. 60", zone: "F6" },
  { from: "Aluva", to: "SN Junction", fare: "Rs. 60", zone: "F6" },
  { from: "Aluva", to: "Thrippunithura", fare: "Rs. 60", zone: "F6" }
]

export default function FaresPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--kmrl-teal)" }}>
          Kochi Metro Fare Chart
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Affordable and transparent pricing for all passengers. Single tickets are valid for 90 minutes 
          from the time of issue and must be used to exit at the destination station.
        </p>
      </div>

      {/* Fare Structure Overview */}
      <Card className="card mb-8">
        <CardHeader>
          <CardTitle>Fare Structure</CardTitle>
          <CardDescription>
            Distance-based fare system with zones increasing by Rs. 10 for every additional zone traveled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fareZones.map((zone) => (
              <div key={zone.zone} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-2" style={{ color: "var(--kmrl-teal)" }}>
                  {zone.fare}
                </div>
                <div className="text-sm text-muted-foreground mb-1">{zone.zone}</div>
                <div className="text-sm font-medium">{zone.distance}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fare Table */}
      <Card className="card mb-8">
        <CardHeader>
          <CardTitle>Complete Fare Chart</CardTitle>
          <CardDescription>
            All station-to-station fares from Aluva (origin station)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From Station</TableHead>
                  <TableHead>To Station</TableHead>
                  <TableHead>Fare</TableHead>
                  <TableHead>Zone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stationFares.map((fare, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{fare.from}</TableCell>
                    <TableCell>{fare.to}</TableCell>
                    <TableCell className="font-semibold" style={{ color: "var(--kmrl-teal)" }}>
                      {fare.fare}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{fare.zone}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Important Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="text-xl">⏰</div>
              Ticket Validity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Single tickets are valid for 90 minutes from issue time</li>
              <li>• Must exit at destination station within validity period</li>
              <li>• Automatic Fare Collection (AFC) gates enforce validity</li>
              <li>• No refunds for unused tickets</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="text-xl">💳</div>
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Cash payments at ticket counters</li>
              <li>• Card payments accepted</li>
              <li>• Digital payment options available</li>
              <li>• Smart card options for regular commuters</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Concessions and Special Fares */}
      <Card className="card mb-8">
        <CardHeader>
          <CardTitle>Concessions & Special Fares</CardTitle>
          <CardDescription>
            Special pricing for various passenger categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">👴</div>
              <h4 className="font-semibold mb-2">Senior Citizens</h4>
              <p className="text-sm text-muted-foreground">50% concession for passengers above 65 years</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">👶</div>
              <h4 className="font-semibold mb-2">Children</h4>
              <p className="text-sm text-muted-foreground">Free travel for children below 5 years</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">♿</div>
              <h4 className="font-semibold mb-2">Divyangjan</h4>
              <p className="text-sm text-muted-foreground">50% concession for persons with disabilities</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">🎓</div>
              <h4 className="font-semibold mb-2">Students</h4>
              <p className="text-sm text-muted-foreground">Special student passes available</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">👮</div>
              <h4 className="font-semibold mb-2">Defense Personnel</h4>
              <p className="text-sm text-muted-foreground">Concessional rates for defense personnel</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">👨‍💼</div>
              <h4 className="font-semibold mb-2">Corporate</h4>
              <p className="text-sm text-muted-foreground">Corporate passes and bulk discounts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Airport Shuttle Service */}
      <Card className="card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="text-xl">✈️</div>
            Airport Shuttle Service
          </CardTitle>
          <CardDescription>
            Daily feeder service connecting Aluva Station to Kochi Airport
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3" style={{ color: "var(--kmrl-teal)" }}>
                Service Details
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Fare: Rs. 50 per trip</li>
                <li>• Frequency: Every 40 minutes</li>
                <li>• First service: 5:00 AM from Airport, 5:40 AM from Aluva</li>
                <li>• Last service: 10:30 PM from Airport, 11:10 PM from Aluva</li>
                <li>• Route: Aluva Station ↔ Kochi Airport</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3" style={{ color: "var(--kmrl-teal)" }}>
                Benefits
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Seamless connectivity to airport</li>
                <li>• Affordable alternative to taxi</li>
                <li>• Regular schedule for planning</li>
                <li>• Comfortable air-conditioned buses</li>
                <li>• Integration with metro system</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
