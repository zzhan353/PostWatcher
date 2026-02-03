import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { CategoriesSection } from "@/components/landing/categories-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <CategoriesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
