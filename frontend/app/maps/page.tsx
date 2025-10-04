"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MapsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--kmrl-teal)" }}>
          Kochi Metro Route Maps
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Interactive route maps showing current operational lines and future expansion plans. 
          Explore station locations, connections, and the complete metro network.
        </p>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Current Network</TabsTrigger>
          <TabsTrigger value="future">Future Network</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-6">
          <div className="space-y-6">
            <Card className="card">
              <CardHeader>
                <CardTitle>Current Operational Route Map</CardTitle>
                <CardDescription>
                  Line-1 (Blue Line): Aluva to Tripunithura - 25 stations across 27.96 km
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-96 rounded-lg overflow-hidden border">
                  <iframe 
                    src="https://www.google.com/maps/d/embed?mid=1SMbNoMbyTkuTVLRpza9UjeO7XSY&ehbc=2E312F" 
                    width="100%" 
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Kochi Metro Current Route Map"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    Line-1 Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Route:</span>
                    <span className="font-medium">Aluva - Tripunithura</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Length:</span>
                    <span className="font-medium">27.96 km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stations:</span>
                    <span className="font-medium">25</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">Elevated</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-green-600">Operational</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Ridership:</span>
                    <span className="font-medium">82,000</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card">
                <CardHeader>
                  <CardTitle>Key Stations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Starting Point:</span>
                      <span className="font-medium">Aluva</span>
                    </div>
                    <div className="flex justify-between">
                      <span>City Center:</span>
                      <span className="font-medium">MG Road</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Educational Hub:</span>
                      <span className="font-medium">CUSAT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sports Complex:</span>
                      <span className="font-medium">JLN Stadium</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ending Point:</span>
                      <span className="font-medium">Tripunithura</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="future" className="mt-6">
          <div className="space-y-6">
            <Card className="card">
              <CardHeader>
                <CardTitle>Future Network Route Map</CardTitle>
                <CardDescription>
                  Complete network including Phase 2 (Pink Line) and future expansion plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-96 rounded-lg overflow-hidden border">
                  <iframe 
                    src="https://www.google.com/maps/d/embed?mid=11uZY6VlZZsn8HNtai27dEnrTQ58&ehbc=2E312F" 
                    width="100%" 
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Kochi Metro Future Network Map"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                    Phase 2 Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Route:</span>
                    <span className="font-medium">JLN Stadium - Infopark II</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Length:</span>
                    <span className="font-medium">11.2 km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stations:</span>
                    <span className="font-medium">11</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">Elevated</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-orange-600">Under Construction</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Completion:</span>
                    <span className="font-medium">Q1 2028</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card">
                <CardHeader>
                  <CardTitle>Phase 2 Key Stations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Starting Point:</span>
                      <span className="font-medium">JLN Stadium</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IT Hub:</span>
                      <span className="font-medium">Kakkanad Junction</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SEZ:</span>
                      <span className="font-medium">Cochin SEZ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tech Parks:</span>
                      <span className="font-medium">InfoPark 1 & 2</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ending Point:</span>
                      <span className="font-medium">Infopark II</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Future Plans */}
            <Card className="card">
              <CardHeader>
                <CardTitle>Future Expansion Plans</CardTitle>
                <CardDescription>
                  Potential Phase 3 and beyond expansion plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: "var(--kmrl-teal)" }}>
                      Phase 3 (Proposed)
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Northern extension to Cochin International Airport</li>
                      <li>• Extension to Angamaly</li>
                      <li>• Additional connectivity to Fort Kochi</li>
                      <li>• Integration with water transport</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: "var(--kmrl-teal)" }}>
                      Integration Goals
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Seamless multimodal transport</li>
                      <li>• Common ticketing system</li>
                      <li>• Unified command and control</li>
                      <li>• Enhanced last-mile connectivity</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Additional Information */}
      <div className="mt-12">
        <Card className="card">
          <CardHeader>
            <CardTitle>System Specifications</CardTitle>
            <CardDescription>
              Technical specifications and operational details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2" style={{ color: "var(--kmrl-teal)" }}>80</div>
                <div className="text-sm text-muted-foreground">Top Speed (kmph)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2" style={{ color: "var(--kmrl-teal)" }}>34</div>
                <div className="text-sm text-muted-foreground">Average Speed (kmph)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2" style={{ color: "var(--kmrl-teal)" }}>1435</div>
                <div className="text-sm text-muted-foreground">Track Gauge (mm)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2" style={{ color: "var(--kmrl-teal)" }}>750V</div>
                <div className="text-sm text-muted-foreground">DC Third Rail</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
