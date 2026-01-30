import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GlobalFooter } from "@/components/navigation/global-footer"
import { Link2, Zap, Shield, BarChart3, ArrowRight, Sparkles, Target, TrendingUp, Clock, DollarSign, Check } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
            Monetize Your Links with{" "}
            <span className="text-primary">Ad-Gated Content</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
            Create links that require viewers to watch ads before accessing your content. 
            Simple, effective, and profitable.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Powerful Features</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Turn your content into revenue with our comprehensive monetization platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-8 pb-8">
                <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-16 h-16 flex items-center justify-center mb-6">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Lightning Fast Setup</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Create monetized links in seconds. Just paste your URL, customize ad requirements, and share with your audience instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-8 pb-8">
                <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-16 h-16 flex items-center justify-center mb-6">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Enterprise Security</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your links are protected with bank-level security. We handle all the infrastructure so you can focus on creating.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-8 pb-8">
                <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-16 h-16 flex items-center justify-center mb-6">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Advanced Analytics</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Monitor views, completions, and conversion rates with real-time analytics. Make data-driven decisions for better results.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-8 pb-8">
                <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-16 h-16 flex items-center justify-center mb-6">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Smart Targeting</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Control how many ads viewers watch before accessing content. Optimize for revenue or user experience.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-8 pb-8">
                <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-16 h-16 flex items-center justify-center mb-6">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Maximize Revenue</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Earn from every view with our optimized ad delivery system. Higher engagement means higher earnings.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-8 pb-8">
                <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-16 h-16 flex items-center justify-center mb-6">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">24/7 Availability</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your links are always online with 99.9% uptime. Never miss an opportunity to earn from your content.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ad Placeholder */}
          <div className="mt-12">
            <Card className="border-2 border-dashed border-primary/20 bg-muted/30">
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-muted-foreground mb-2">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-sm font-medium">Advertisement Space</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    This space is reserved for future advertising content
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Simple Pricing</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl mb-2">Free</CardTitle>
                <CardDescription className="text-base">Perfect for getting started</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-8">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Up to 10 links</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Basic analytics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">1-5 ads per link</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Community support</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline" asChild>
                  <Link href="/auth/sign-up">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-primary shadow-xl scale-105 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium" aria-label="Most popular plan">
                Most Popular
              </div>
              <CardHeader className="text-center pb-8 pt-10">
                <CardTitle className="text-2xl mb-2">Pro</CardTitle>
                <CardDescription className="text-base">For serious creators</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$19</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-8">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">Unlimited links</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">Custom branding</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">Priority support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">API access</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" asChild>
                  <Link href="/auth/sign-up">Start Free Trial</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl mb-2">Enterprise</CardTitle>
                <CardDescription className="text-base">For large teams</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-8">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Everything in Pro</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Custom integrations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">SLA guarantees</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline" asChild>
                  <Link href="/auth/sign-up">Contact Sales</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of creators who are already monetizing their content with LootLinks.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">Create Your First Link</Link>
          </Button>
        </div>
      </section>

      {/* Global Footer */}
      <GlobalFooter />
    </div>
  )
}
