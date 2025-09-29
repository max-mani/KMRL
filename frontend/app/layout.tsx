import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
// import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { NavBar } from "@/components/nav-bar"
import { Footer } from "@/components/footer"
import { Suspense } from "react"
import { FloatingChatbot } from "@/components/chatbot"

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <div className="min-h-dvh flex flex-col bg-background text-foreground">
          <Suspense fallback={<div>Loading...</div>}>
            <NavBar />
            <main className="flex-1">{children}</main>
            <Footer />
          </Suspense>
        </div>
        <FloatingChatbot />
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
