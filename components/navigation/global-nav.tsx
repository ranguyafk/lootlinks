"use client"

import Link from "next/link"
import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Link2, Menu, X } from "lucide-react"

export function GlobalNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isSignedIn } = useUser()

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "/dashboard", label: "Dashboard" },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2a2a2a] border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
            <Link2 className="h-6 w-6" />
            <span className="text-xl font-bold">LootLinks</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons - Only show if user is not logged in */}
          {!isSignedIn && (
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" asChild className="hover:text-primary">
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Show Dashboard button if user is logged in */}
          {isSignedIn && (
            <div className="hidden md:flex items-center gap-4">
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-foreground hover:text-primary transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {/* Mobile Auth Buttons - Only show if user is not logged in */}
              {!isSignedIn && (
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <Button variant="ghost" asChild className="w-full hover:text-primary">
                    <Link href="/auth/sign-in">Sign In</Link>
                  </Button>
                  <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/auth/sign-up">Sign Up</Link>
                  </Button>
                </div>
              )}
              {/* Show Dashboard button if user is logged in */}
              {isSignedIn && (
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
