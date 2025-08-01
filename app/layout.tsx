import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MediChat India - AI Medical Assistant",
  description:
    "Get instant medical guidance and health information with AI-powered assistance. Designed for India with local emergency contacts and healthcare guidance.",
  keywords: "medical assistant, health AI, India healthcare, medical guidance, symptoms checker",
  authors: [{ name: "MediChat India Team" }],
  openGraph: {
    title: "MediChat India - AI Medical Assistant",
    description: "Get instant medical guidance and health information with AI-powered assistance",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
