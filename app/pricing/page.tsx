"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Zap, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PRODUCTS } from "@/lib/products"
import { createCheckoutSession } from "@/app/actions/stripe"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

export default function PricingPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleCheckout(productId: string) {
    setLoadingId(productId)
    try {
      const result = await createCheckoutSession(productId)
      if (result.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">
                <Zap className="w-3 h-3 mr-1" />
                Simple Pricing
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4 text-balance">
                Choose Your Plan
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
                Start free and scale as you grow. All plans include access to
                our core monitoring features.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {PRODUCTS.map((product) => (
                <Card
                  key={product.id}
                  className={`relative flex flex-col ${
                    product.popular
                      ? "border-primary shadow-lg scale-105"
                      : "border-border"
                  }`}
                >
                  {product.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl">{product.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {product.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold text-foreground">
                        {product.priceInCents === 0
                          ? "Free"
                          : `$${(product.priceInCents / 100).toFixed(0)}`}
                      </span>
                      {product.priceInCents > 0 && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>

                    <ul className="space-y-3">
                      {product.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={product.popular ? "default" : "outline"}
                      onClick={() => handleCheckout(product.id)}
                      disabled={loadingId !== null}
                    >
                      {loadingId === product.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : product.priceInCents === 0 ? (
                        "Get Started Free"
                      ) : (
                        "Subscribe Now"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-muted-foreground mb-4">
                Need a custom plan for your enterprise?
              </p>
              <Button variant="outline" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
