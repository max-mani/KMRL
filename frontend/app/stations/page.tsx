"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const stations = [
  {
    name: "Aluva",
    theme: "ABUNDANT BOUNTY OF NATURE IN KERALA WITH A SPECIAL FOCUS ON WESTERN GHATS, PERIYAR & OTHER RIVERS",
    description: "There are 44 rivers in Kerala, all but three originating in the Western Ghats. 41 of them flow westward and 3 eastward. The rivers of Kerala are small, in terms of length, breadth and water discharge. The rivers flow faster, owing to the hilly terrain and the short distance between the Western Ghats and the sea. Major rivers: Periyar, Pamba, Bharathapuzha, Chaliyar, Chalakudi, Kadalundi.",
    contact: "+91 73566 02863",
    status: "operational"
  },
  {
    name: "Pulinchodu",
    theme: "Western Ghats – Ecological region, flora & fauna",
    description: "Ecoregions – South Western Ghats moist deciduous forests, South Western Ghats montane rain forests. The sheer number of species of plants (exceeding 4000) in the Western Ghats of Kerala, of which nearly 1500 i.e. more than 30% are endemic to this region.",
    contact: "+91 73566 02864",
    status: "operational"
  },
  {
    name: "Companypadi",
    theme: "Western Ghats – Hills & peaks",
    description: "Wayanad, Silent valley, Anaimalai hills, Cardamom hills, Agastya hills, Nilgiri Hills",
    contact: "+91 73566 02865",
    status: "operational"
  },
  {
    name: "Ambattukavu",
    theme: "Western Ghats – Snails, slugs & snakes",
    description: "Ariophantidae, Indrella ampulla, Naninia banggaiensis. King Cobra, Malabar pit viper, Banded kukri, Green vine snake, Montane trinket snake, Travancore wolf snake, Khaire's black shield tail Indian rock python, Indian cobra, Indian krait",
    contact: "+91 73566 02866",
    status: "operational"
  },
  {
    name: "Muttom",
    theme: "Western Ghats – Birds",
    description: "Black and Orange Flycatcher, Black-crested Bulbul, Broad-tailed grass bird, Crimson-backed Sunbird, Grey-fronted green pigeon, Grey-headed Bulbul, Kerala Laughing thrush",
    contact: "+91 73566 02867",
    status: "operational"
  },
  {
    name: "Kalamassery",
    theme: "Western Ghats",
    description: "Gateway to the industrial and educational hub of Kochi",
    contact: "+91 73566 02868",
    status: "operational"
  },
  {
    name: "CUSAT",
    theme: "MARITIME HISTORY OF KERALA",
    description: "Cochin University of Science and Technology station showcasing Kerala's rich maritime heritage",
    contact: "+91 73566 02869",
    status: "operational"
  },
  {
    name: "Pathadipalam",
    theme: "Western Ghats – Fishes",
    description: "There is higher fish richness in the southern part of the Western Ghats than in the northern And the highest is in the Chalakudy River, which alone holds 98 species. The most species rich families are the Cyprinids (72 species), hill stream loaches (34 species), Bagrid catfishes (19 species) and Sisorid catfishes (12 species).",
    contact: "+91 73566 02871",
    status: "operational"
  },
  {
    name: "Edapally",
    theme: "SPICES AND CROPS OF KERALA",
    description: "Celebrating Kerala's agricultural heritage and spice trade",
    contact: "+91 73566 02874",
    status: "operational"
  },
  {
    name: "Changampuzha Park",
    theme: "CULTURAL AND ARTISTIC HERITAGE OF KERALA",
    description: "Named after the famous Malayalam poet Changampuzha Krishna Pillai",
    contact: "+91 73566 02873",
    status: "operational"
  },
  {
    name: "Palarivattom",
    theme: "Western Ghats – Flowers",
    description: "Showcasing the diverse floral biodiversity of the Western Ghats",
    contact: "+91 73566 02872",
    status: "operational"
  },
  {
    name: "JLN Stadium",
    theme: "SPORTING HERITAGE OF KERALA",
    description: "Named after Jawaharlal Nehru Stadium, celebrating Kerala's sporting achievements",
    contact: "+91 73566 02880",
    status: "operational"
  },
  {
    name: "Kaloor",
    theme: "Western Ghats – Monsoon, waterfall & waterbodies",
    description: "Athirapally is situated 1000 ft. above sea level, on the Chalakudy river, approximately 80 feet in height. Other waterfalls: Dudhsagar, Hogenakkal, Jog, Kunchikal, Sivasamudram and Unchalli. Lakes: Ooty, Kodaikanal, Berijam, Pookkode Lake, Devikulam, Letchmi",
    contact: "+91 73566 02881",
    status: "operational"
  },
  {
    name: "Town Hall",
    theme: "Western Ghats – Dragonflies & butterflies",
    description: "The Western Ghats is home to 174 species of Odonates (107 dragonflies and 67 damselflies), including 69 endemics. Kerala is a haven for butterflies. There are about 332 species of butterflies in Kerala. Of them, 37 species are endemic to Western Ghats.",
    contact: "+91 73566 02882",
    status: "operational"
  },
  {
    name: "MG Road",
    theme: "ERNAKULAM AND ITS HISTORY",
    description: "The commercial heart of Kochi, showcasing the city's historical significance",
    contact: "+91 73566 02883",
    status: "operational"
  },
  {
    name: "Maharajas College",
    theme: "Western Ghats – Endangered species & mammals",
    description: "The great Western Ghats are home to thousands of rare and magnificent mammals including The big cats of India black panther, Leopard and the Royal Bengal Tiger. The endangered mammal of the Western Ghats are lion-tailed macaque and Malabar large-spotted civet.",
    contact: "+91 73566 02884",
    status: "operational"
  },
  {
    name: "Ernakulam South",
    theme: "Kerala Tourism",
    description: "Gateway to Kerala's tourism destinations and cultural heritage",
    contact: "+91 81293 59444",
    status: "operational"
  },
  {
    name: "Kadavanthara",
    theme: "History Of Print Media",
    description: "Celebrating Kerala's rich tradition in print media and journalism",
    contact: "+91 81294 57444",
    status: "operational"
  },
  {
    name: "Elamkulam",
    theme: "Uru",
    description: "Traditional Kerala boat-making heritage",
    contact: "+91 81295 38444",
    status: "operational"
  },
  {
    name: "Vyttila",
    theme: "History of Malayalam Cinema",
    description: "Celebrating Malayalam cinema's contribution to Indian film industry",
    contact: "+91 81295 41444",
    status: "operational"
  },
  {
    name: "Thykoodam",
    theme: "Kerala Cuisine",
    description: "Showcasing Kerala's diverse and flavorful culinary traditions",
    contact: "+91 81296 93444",
    status: "operational"
  },
  {
    name: "Petta",
    theme: "Fishing",
    description: "Celebrating Kerala's fishing heritage and coastal culture",
    contact: "+91 73568 88974",
    status: "operational"
  },
  {
    name: "Vadakkekotta",
    theme: "Historical Fort",
    description: "Historical significance of Vadakkekotta fort",
    contact: "+91 73569 21114",
    status: "operational"
  },
  {
    name: "SN Junction",
    theme: "Transportation Hub",
    description: "Major transportation junction connecting different parts of Kochi",
    contact: "+91 73569 22234",
    status: "operational"
  },
  {
    name: "Thrippunithura",
    theme: "Royal Heritage",
    description: "Former capital of the Kingdom of Cochin, showcasing royal heritage",
    contact: "+91 81290 88873",
    status: "operational"
  }
]

const phase2Stations = [
  {
    name: "JLN Stadium (New Station Box)",
    description: "Enhanced station box for Phase 2 connectivity",
    status: "under_construction"
  },
  {
    name: "Palarivattom Junction",
    description: "Junction station connecting Phase 1 and Phase 2",
    status: "under_construction"
  },
  {
    name: "Palarivattom Bypass",
    description: "Bypass route station",
    status: "under_construction"
  },
  {
    name: "Chembumukku",
    description: "Residential and commercial area station",
    status: "under_construction"
  },
  {
    name: "Vazhakkala",
    description: "Gateway to Kakkanad IT corridor",
    status: "under_construction"
  },
  {
    name: "Padamughal",
    description: "Formerly Kunnumpuram, residential area station",
    status: "under_construction"
  },
  {
    name: "Kakkanad Junction",
    description: "Major junction connecting IT parks",
    status: "under_construction"
  },
  {
    name: "Cochin SEZ",
    description: "Special Economic Zone station",
    status: "under_construction"
  },
  {
    name: "Chittethukara",
    description: "Residential area station",
    status: "under_construction"
  },
  {
    name: "KINFRA",
    description: "Formerly Rajagiri, industrial area station",
    status: "under_construction"
  },
  {
    name: "InfoPark 1 / Smart City 1",
    description: "First IT park station",
    status: "under_construction"
  },
  {
    name: "InfoPark 2 / Smart City 2",
    description: "Second IT park station",
    status: "under_construction"
  }
]

export default function StationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--kmrl-teal)" }}>
          Kochi Metro Stations
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Explore all 25 operational stations on Line-1 and 11 upcoming stations on Line-2. 
          Each station is uniquely themed to showcase Kerala's rich cultural and natural heritage.
        </p>
      </div>

      <Tabs defaultValue="operational" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="operational">Line-1 (Operational)</TabsTrigger>
          <TabsTrigger value="construction">Line-2 (Under Construction)</TabsTrigger>
        </TabsList>

        <TabsContent value="operational" className="mt-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Line-1: Aluva - Tripunithura</h2>
            <p className="text-muted-foreground">
              25 stations across 27.96 km, each uniquely themed to celebrate Kerala's heritage
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stations.map((station, index) => (
              <Card key={station.name} className="card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{station.name}</CardTitle>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <CardDescription className="text-sm font-medium">
                    Station #{index + 1}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2" style={{ color: "var(--kmrl-teal)" }}>
                      Theme
                    </h4>
                    <p className="text-sm text-muted-foreground">{station.theme}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-2" style={{ color: "var(--kmrl-teal)" }}>
                      Description
                    </h4>
                    <p className="text-sm text-muted-foreground">{station.description}</p>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Station Controller:</span>
                      <span className="text-sm text-muted-foreground">{station.contact}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="construction" className="mt-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Line-2: JLN Stadium - Infopark II</h2>
            <p className="text-muted-foreground">
              11 stations across 11.2 km, connecting Kochi's IT corridor
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {phase2Stations.map((station, index) => (
              <Card key={station.name} className="card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{station.name}</CardTitle>
                    <Badge className="bg-orange-100 text-orange-800">Under Construction</Badge>
                  </div>
                  <CardDescription className="text-sm font-medium">
                    Phase 2 Station #{index + 1}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{station.description}</p>
                  <div className="mt-4 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Expected completion: Q1 2028</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Station Route Visualization */}
      <div className="mt-12">
        <Card className="card">
          <CardHeader>
            <CardTitle>Station Route Sequence</CardTitle>
            <CardDescription>
              Complete route from Aluva to Tripunithura with all 25 stations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {stations.map((station, index) => (
                <div key={station.name} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full station-number text-white text-xs flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{station.name}</span>
                  </div>
                  {index < stations.length - 1 && (
                    <div className="mx-2 text-muted-foreground">→</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
