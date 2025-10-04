"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--kmrl-teal)" }}>
          About Kochi Metro Rail Limited
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          India's first metro system with integrated multimodal transport, serving Kochi with world-class 
          infrastructure and innovative solutions for urban mobility.
        </p>
      </div>

      {/* Vision & Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card className="card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="text-2xl">🎯</div>
              Vision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              To enrich the quality of life for everyone in Kochi by facilitating better connectivity 
              between people, between people and places, and between people and prosperity.
            </p>
          </CardContent>
        </Card>

        <Card className="card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="text-2xl">🚀</div>
              Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              To make Kochi a more liveable and pleasant city for residents and visitors alike, where 
              public transportation would be used by all – connecting people and places safely, 
              seamlessly, reliably and comfortably.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Goals */}
      <Card className="card mb-12">
        <CardHeader>
          <CardTitle>Strategic Goals</CardTitle>
          <CardDescription>
            Our comprehensive approach to transforming urban transportation in Kochi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--kmrl-teal)] text-white text-xs flex items-center justify-center font-semibold mt-1">1</div>
                <div>
                  <h4 className="font-semibold mb-2">World-Class Metro System</h4>
                  <p className="text-sm text-muted-foreground">
                    Introduce a world-class metro system in Cochin to enhance quality of life by improving 
                    regional connections and reducing overcrowding, traffic congestion, transit time, air and noise pollution.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--kmrl-teal)] text-white text-xs flex items-center justify-center font-semibold mt-1">2</div>
                <div>
                  <h4 className="font-semibold mb-2">Stakeholder Approach</h4>
                  <p className="text-sm text-muted-foreground">
                    Adopt a stakeholder approach to improve connectivity and quality of life by coordinating 
                    and consulting with community groups, business groups, environmental groups, and regulatory agencies.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--kmrl-teal)] text-white text-xs flex items-center justify-center font-semibold mt-1">3</div>
                <div>
                  <h4 className="font-semibold mb-2">Airport Connectivity</h4>
                  <p className="text-sm text-muted-foreground">
                    Connect metro with the Cochin International Airport to create seamless transition, 
                    transit, and interconnectivity.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--kmrl-teal)] text-white text-xs flex items-center justify-center font-semibold mt-1">4</div>
                <div>
                  <h4 className="font-semibold mb-2">Fort Cochin Extension</h4>
                  <p className="text-sm text-muted-foreground">
                    Plan and extend the metro to Fort Cochin, connecting the historic part of the city 
                    with modern transportation infrastructure.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--kmrl-teal)] text-white text-xs flex items-center justify-center font-semibold mt-1">5</div>
                <div>
                  <h4 className="font-semibold mb-2">Transport Hubs</h4>
                  <p className="text-sm text-muted-foreground">
                    Create transport hubs with metro, bus and rail links, providing seamless 
                    multimodal connectivity across the city.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--kmrl-teal)] text-white text-xs flex items-center justify-center font-semibold mt-1">6</div>
                <div>
                  <h4 className="font-semibold mb-2">Economic Vitality</h4>
                  <p className="text-sm text-muted-foreground">
                    Increase the economic vitality of the region by improving infrastructure, 
                    resulting in further development of greater Kochi as an economic, transportation, and tourism hub.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Values */}
      <Card className="card mb-12">
        <CardHeader>
          <CardTitle>Our Values</CardTitle>
          <CardDescription>
            The principles that guide our operations and decision-making
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-3">🛡️</div>
              <h4 className="font-semibold mb-2">Safety and Service</h4>
              <p className="text-sm text-muted-foreground">
                We commit to provide a safe, reliable and customer-friendly transportation experience.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">🤝</div>
              <h4 className="font-semibold mb-2">Community Involvement</h4>
              <p className="text-sm text-muted-foreground">
                We value being a part of the greater Kochi community and strive to contribute to economic growth.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">🌱</div>
              <h4 className="font-semibold mb-2">Environmental Sustainability</h4>
              <p className="text-sm text-muted-foreground">
                We believe in sustainable economic development where infrastructural, economic and ecological concerns are integrated.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">👥</div>
              <h4 className="font-semibold mb-2">Employee Empowerment</h4>
              <p className="text-sm text-muted-foreground">
                We commit to a work environment where employees are treated with respect and teamwork is rewarded.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">📊</div>
              <h4 className="font-semibold mb-2">Fiscal Responsibility</h4>
              <p className="text-sm text-muted-foreground">
                We pledge to being fiscally responsible as well as being accountable for our actions.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">🎨</div>
              <h4 className="font-semibold mb-2">Cultural Heritage</h4>
              <p className="text-sm text-muted-foreground">
                We celebrate and preserve Kerala's rich cultural heritage through themed stations and design.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrated Transportation System */}
      <Card className="card mb-12">
        <CardHeader>
          <CardTitle>Towards an Integrated Transportation System</CardTitle>
          <CardDescription>
            Our vision for seamless multimodal transport in Kochi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Kochi Metro Rail Limited was started with the objective of building and running a metro line, 
              but later we decided to use KMRL as an opportunity to migrate citizens from personal vehicles 
              to public transport and change the face of transportation and mobility in the process.
            </p>
            
            <p className="text-muted-foreground">
              KMRL is trying to build itself as Kerala's urban transport solutions provider. By being the first 
              metro system in the country with an integrated multimodal transport system, Kochi Metro will not 
              only give the city a much-required face-lift but also provide an end-to-end connectivity.
            </p>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h4 className="font-semibold mb-3" style={{ color: "var(--kmrl-teal)" }}>
                Our Objective
              </h4>
              <p className="text-muted-foreground">
                To make Kochi the first city in the country where the entire public transport system: 
                the metro, the buses, the boats, the auto-rickshaws and the taxies work together as a 
                seamless integrated system; with a common timetable, common ticketing and centralised 
                command and control.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <Card className="card">
        <CardHeader>
          <CardTitle>Key Statistics</CardTitle>
          <CardDescription>
            Current operational metrics and achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2" style={{ color: "var(--kmrl-teal)" }}>25</div>
              <div className="text-sm text-muted-foreground">Operational Stations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2" style={{ color: "var(--kmrl-teal)" }}>27.96</div>
              <div className="text-sm text-muted-foreground">KM Operational Length</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2" style={{ color: "var(--kmrl-teal)" }}>82K</div>
              <div className="text-sm text-muted-foreground">Daily Ridership</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2" style={{ color: "var(--kmrl-teal)" }}>75</div>
              <div className="text-sm text-muted-foreground">Rolling Stock Coaches</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
