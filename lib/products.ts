export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  features: string[]
  watcherLimit: number
  alertLimit: number
  popular?: boolean
}

export const PRODUCTS: Product[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for getting started with post watching",
    priceInCents: 0,
    watcherLimit: 3,
    alertLimit: 50,
    features: [
      "Up to 3 watchers",
      "50 alerts per month",
      "Email notifications",
      "Basic categories (Jobs, Shopping)",
      "Daily digest",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For power users who need more monitoring",
    priceInCents: 999,
    watcherLimit: 25,
    alertLimit: 500,
    popular: true,
    features: [
      "Up to 25 watchers",
      "500 alerts per month",
      "Email + SMS notifications",
      "All categories",
      "Real-time alerts",
      "Advanced filters",
      "Priority support",
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "For teams and businesses with high-volume needs",
    priceInCents: 2999,
    watcherLimit: 100,
    alertLimit: 5000,
    features: [
      "Up to 100 watchers",
      "5,000 alerts per month",
      "All notification channels",
      "All categories",
      "Real-time alerts",
      "Advanced filters",
      "API access",
      "Webhook integrations",
      "Dedicated support",
      "Custom categories",
    ],
  },
]
