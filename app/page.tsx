import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/home/hero-section"
import { CinematicShowcaseSection } from "@/components/home/cinematic-showcase-section"
import { ContentSection } from "@/components/home/content-section"
import { FeaturesGridSection } from "@/components/home/features-grid-section"
import { Suspense } from "react"
import dynamic from "next/dynamic"

// Loading placeholder for better UX during lazy loading
function SectionSkeleton() {
  return <div className="w-full h-96 bg-[#3a3d44] animate-pulse" />
}

// Lazy load heavy below-fold sections with loading and error UI
const BrandValuesSection = dynamic(
  () => import("@/components/home/brand-values-section").then(m => ({ default: m.BrandValuesSection })),
  { loading: () => <SectionSkeleton />, ssr: true }
)
const ShowcaseGallerySection = dynamic(
  () => import("@/components/home/showcase-gallery-section").then(m => ({ default: m.ShowcaseGallerySection })),
  { loading: () => <SectionSkeleton />, ssr: true }
)
const CategoriesSection = dynamic(
  () => import("@/components/home/categories-section").then(m => ({ default: m.CategoriesSection })),
  { loading: () => <SectionSkeleton />, ssr: true }
)
const BrandLogosSection = dynamic(
  () => import("@/components/brand-logos").then(m => ({ default: m.BrandLogosSection })),
  { loading: () => <SectionSkeleton />, ssr: true }
)

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#3a3d44]">
        <HeroSection />
        <CinematicShowcaseSection />
        <FeaturesGridSection />
        <ContentSection />
        <Suspense fallback={<SectionSkeleton />}>
          <BrandValuesSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <ShowcaseGallerySection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <CategoriesSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <BrandLogosSection />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
