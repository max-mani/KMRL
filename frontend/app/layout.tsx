import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
// import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import ChatBot from "@/components/chatbot"
import { Suspense } from "react"
import { ManualOverrideProvider } from "@/components/manual-override"
import { ToastProvider } from "@/components/ui/toast"

export const metadata: Metadata = {
  title: "KMRL Fleet Optimization",
  description: "KMRL Fleet Optimization Platform",
  generator: "v0.app",
  icons: {
    icon: "/Koch_Metro_Logo.png",
    shortcut: "/Koch_Metro_Logo.png",
    apple: "/Koch_Metro_Logo.png",
  },
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <Suspense fallback={<div>Loading...</div>}>
        <NavBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </Suspense>
    </div>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ManualOverrideProvider>
          <ToastProvider>
            <LayoutContent>{children}</LayoutContent>
          </ToastProvider>
        </ManualOverrideProvider>
        <ChatBot />
        <div suppressHydrationWarning>
          {typeof window !== 'undefined' ? (
            <div style={{ position: 'fixed', bottom: 12, right: 12, fontSize: 12, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '4px 8px', borderRadius: 6, zIndex: 9999 }}>
              Analytics: enabled
            </div>
          ) : null}
        </div>
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
