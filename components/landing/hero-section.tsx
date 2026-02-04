import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bell, Zap, Shield } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-accent" />
            <span>Real-time monitoring across the web</span>
          </div>
          
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Never Miss an
            <span className="text-primary"> Important Post</span> Again
          </h1>
          
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Watcher monitors jobs, deals, real estate, stocks, news, and social media for you. 
            Get instant alerts when posts match your criteria.
          </p>
          
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/auth/sign-up">
                Start Watching Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent" asChild>
              <Link href="#features">See How It Works</Link>
            </Button>
          </div>
          
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span>Instant Alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Privacy First</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Always Running</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
