import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/Koch_Metro_Logo.png"
                alt="Kochi Metro Rail Limited Logo"
                className="h-8 w-auto"
              />
              <span className="font-semibold text-lg">KMRL</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              India's first metro system with integrated multimodal transport, 
              serving Kochi with world-class infrastructure.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>4th Floor, JLN Stadium Metro Station</p>
              <p>Kaloor, Kochi – 682 017</p>
              <p>Phone: +91 (484) 284 6700</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <nav className="space-y-2">
              <Link href="/stations" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Stations
              </Link>
              <Link href="/maps" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Route Maps
              </Link>
              <Link href="/fares" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Fare Chart
              </Link>
              <Link href="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                About KMRL
              </Link>
            </nav>
          </div>

          {/* Platform Features */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <nav className="space-y-2">
              <Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Fleet Status
              </Link>
              <Link href="/performance" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Performance
              </Link>
              <Link href="/maintenance" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Maintenance
              </Link>
              <Link href="/analytics" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Analytics
              </Link>
            </nav>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="font-semibold mb-4">Contact & Legal</h4>
            <nav className="space-y-2">
              <Link href="/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact Us
              </Link>
              <Link href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <a 
                href="https://kochimetro.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Official Website
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Kochi Metro Rail Limited. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Chief Vigilance Officer: cvo@kmrl.co.in</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>System Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
