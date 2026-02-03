import { Bell, Clock, Filter, Globe, Sparkles, Zap } from "lucide-react"

const features = [
  {
    icon: Globe,
    title: "Multi-Source Monitoring",
    description: "Track posts from job boards, e-commerce sites, real estate platforms, social media, and news outlets all in one place."
  },
  {
    icon: Filter,
    title: "Smart Filters",
    description: "Set up powerful keyword filters, price ranges, location constraints, and custom rules to get only relevant alerts."
  },
  {
    icon: Bell,
    title: "Instant Notifications",
    description: "Get real-time alerts via email, SMS, or push notifications the moment a matching post appears."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Our infrastructure checks sources every minute, ensuring you never miss time-sensitive opportunities."
  },
  {
    icon: Clock,
    title: "24/7 Monitoring",
    description: "Your watchers run continuously, even when you sleep. Never miss a post because of timezone differences."
  },
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    description: "Our AI understands context and finds relevant posts even when they do not match your exact keywords."
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Stay Ahead
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Powerful features designed to help you catch every opportunity before anyone else.
          </p>
        </div>
        
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
