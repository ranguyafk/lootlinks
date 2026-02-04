import type { Metadata, Viewport } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "sonner"
import { GlobalNav } from "@/components/navigation/global-nav"
import "./globals.css"

export const metadata: Metadata = {
  title: "LootLinks - Monetize Your Links",
  description: "Create ad-gated links and monetize your content with LootLinks",
}

export const viewport: Viewport = {
  themeColor: "#FFD500",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="font-sans antialiased">
          <GlobalNav />
          <main className="pt-16">
            {children}
          </main>
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}
