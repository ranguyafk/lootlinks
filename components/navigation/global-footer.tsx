import Link from "next/link"
import { Link2 } from "lucide-react"

export function GlobalFooter() {
  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "API Docs", href: "#api" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blog", href: "#blog" },
        { label: "Help Center", href: "#help" },
        { label: "Tutorials", href: "#tutorials" },
        { label: "Status", href: "#status" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#about" },
        { label: "Careers", href: "#careers" },
        { label: "Contact", href: "#contact" },
        { label: "Privacy", href: "#privacy" },
      ],
    },
    {
      title: "Connect",
      links: [
        { label: "Twitter", href: "https://twitter.com" },
        { label: "GitHub", href: "https://github.com" },
        { label: "Discord", href: "https://discord.com" },
        { label: "Email", href: "mailto:hello@lootlinks.com" },
      ],
    },
  ]

  return (
    <footer className="bg-[#2a2a2a] border-t border-border">
      <div className="container mx-auto px-4 py-12">
        {/* Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-primary font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Link2 className="h-5 w-5" />
              <span className="font-semibold">LootLinks</span>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="#terms" className="hover:text-primary transition-colors">
                Terms
              </Link>
              <Link href="#privacy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="#cookies" className="hover:text-primary transition-colors">
                Cookies
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} LootLinks. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
