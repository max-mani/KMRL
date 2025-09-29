import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Kochi Metro Rail Limited</p>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/maintenance" className="hover:underline">
            Maintenance
          </Link>
          <Link href="/performance" className="hover:underline">
            System Performance
          </Link>
          <Link href="/insights" className="hover:underline">
            Critical Insights
          </Link>
          <Link href="/history" className="hover:underline">
            Historical Data
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  )
}
