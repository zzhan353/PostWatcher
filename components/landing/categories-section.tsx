import { Briefcase, Home, Newspaper, ShoppingCart, TrendingUp, Users } from "lucide-react"

const categories = [
  {
    icon: Briefcase,
    name: "Jobs",
    description: "Track job postings from LinkedIn, Indeed, Glassdoor, and company career pages.",
    examples: ["Remote developer jobs", "Marketing positions in NYC", "Startup opportunities"]
  },
  {
    icon: ShoppingCart,
    name: "Shopping & Deals",
    description: "Monitor prices and product availability across e-commerce platforms.",
    examples: ["GPU price drops", "Limited edition releases", "Flash sales"]
  },
  {
    icon: Home,
    name: "Real Estate",
    description: "Watch for new property listings, price changes, and market opportunities.",
    examples: ["Apartments under budget", "Houses in preferred areas", "Investment properties"]
  },
  {
    icon: TrendingUp,
    name: "Stocks & Crypto",
    description: "Get alerts on price movements, news, and market analysis posts.",
    examples: ["Price target alerts", "Earnings announcements", "Analyst ratings"]
  },
  {
    icon: Users,
    name: "Social Media",
    description: "Track mentions, hashtags, and posts from influencers and brands.",
    examples: ["Brand mentions", "Competitor activity", "Trending topics"]
  },
  {
    icon: Newspaper,
    name: "News",
    description: "Stay updated with breaking news and articles matching your interests.",
    examples: ["Industry news", "Company announcements", "Topic alerts"]
  }
]

export function CategoriesSection() {
  return (
    <section id="categories" className="bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Watch Any Type of Post
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            From job hunting to deal hunting, WatchFlow has you covered across all major categories.
          </p>
        </div>
        
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.name}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <category.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{category.name}</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{category.description}</p>
              <div className="flex flex-wrap gap-2">
                {category.examples.map((example) => (
                  <span
                    key={example}
                    className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
