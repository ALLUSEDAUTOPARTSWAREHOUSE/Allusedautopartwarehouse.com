"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroBanner } from "@/components/hero-banner"
import { BrandLogosSection } from "@/components/brand-logos"
import { CAR_MAKES, CAR_MODELS, BRAND_COLORS, PART_CATEGORIES, getBrandLogoUrl } from "@/lib/data"
import brandManifest from "@/data/brands/manifest.json"
import { Search, Phone, Eye, X, Settings, Wrench } from "lucide-react"

/** Slugs of brands that have a generated product catalog at /brands/[slug]. */
const CATALOG_SLUGS = new Set((brandManifest as { slug: string }[]).map((b) => b.slug))

/** Product count map from manifest */
const BRAND_COUNTS: { [key: string]: number } = {}
;(brandManifest as { slug: string; count: number }[]).forEach((b) => {
  BRAND_COUNTS[b.slug] = b.count
})

/** Convert a display make name to its catalog slug. */
function makeToSlug(make: string): string {
  return make.toLowerCase().replace(/\s+/g, "-")
}

function getInitials(brand: string): string {
  const words = brand.split(/[\s-]+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return brand.substring(0, brand.length > 4 ? 3 : brand.length).toUpperCase()
}

function MakeLogo({ brand, size = "sm" }: { brand: string; size?: "sm" | "lg" }) {
  const [imgFailed, setImgFailed] = useState(false)
  const logoUrl = getBrandLogoUrl(brand)
  const color = BRAND_COLORS[brand] || "#333"
  const initials = getInitials(brand)
  const w = size === "lg" ? "w-[88px] h-[56px]" : "w-[72px] h-[48px]"
  const textSize = size === "lg" ? "text-lg" : "text-[13px]"

  return (
    <div className={`${w} luxury-logo-tile flex items-center justify-center rounded-lg shrink-0 overflow-hidden`}>
      {logoUrl && !imgFailed ? (
        <img
          src={logoUrl}
          alt={`${brand} logo`}
          className="w-full h-full object-cover rounded-lg"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center rounded-lg" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd, ${color}88)` }}>
          <span className={`${textSize} font-black text-white/90 uppercase tracking-wider leading-none select-none`} style={{ textShadow: "0 2px 6px rgba(0,0,0,0.6), 0 0 12px rgba(255,255,255,0.1)" }}>
            {initials}
          </span>
        </div>
      )}
    </div>
  )
}

type SortOption = "name-asc" | "name-desc" | "count-desc" | "count-asc"

function getCountBadgeColor(count: number): string {
  if (count >= 2000) return "bg-green-900 text-green-200"
  if (count >= 500) return "bg-yellow-900 text-yellow-200"
  return "bg-red-900 text-red-200"
}

export default function MakesPage() {
  const [selectedMake, setSelectedMake] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("name-asc")
  const models = selectedMake ? CAR_MODELS[selectedMake] || [] : []

  const allMakes = CAR_MAKES.slice().sort()
  const letters = Array.from(new Set(allMakes.map((m) => m[0].toUpperCase()))).sort()
  const tabs = ["All", ...letters]
  const [activeTab, setActiveTab] = useState("All")
  
  // Filter by search and letter tab
  let filtered = allMakes.filter((m) => {
    const matchesTab = activeTab === "All" || m[0].toUpperCase() === activeTab
    const matchesSearch = searchQuery === "" || m.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  // Sort
  if (sortBy === "name-asc") {
    filtered.sort((a, b) => a.localeCompare(b))
  } else if (sortBy === "name-desc") {
    filtered.sort((a, b) => b.localeCompare(a))
  } else if (sortBy === "count-desc") {
    filtered.sort((a, b) => {
      const countA = BRAND_COUNTS[makeToSlug(a)] || 0
      const countB = BRAND_COUNTS[makeToSlug(b)] || 0
      return countB - countA
    })
  } else if (sortBy === "count-asc") {
    filtered.sort((a, b) => {
      const countA = BRAND_COUNTS[makeToSlug(a)] || 0
      const countB = BRAND_COUNTS[makeToSlug(b)] || 0
      return countA - countB
    })
  }

  const filteredMakes = filtered

  // Top 3 brands by inventory (shown only when no search is active)
  const topBrands = searchQuery === ""
    ? allMakes
        .slice()
        .sort((a, b) => (BRAND_COUNTS[makeToSlug(b)] || 0) - (BRAND_COUNTS[makeToSlug(a)] || 0))
        .slice(0, 3)
    : []

  return (
    <>
      <Navbar />
      <main className="pt-0">
        {/* Hero Banner */}
        <HeroBanner
          title="Car Brands & Makes"
          subtitle="Select a brand to see available models and search for specific parts. We carry parts for all major makes."
          pathname="/makes"
        />

        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 sm:py-12">
          {/* Search & Sort Controls */}
          <div className="mb-6 sm:mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Box */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search brands by name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSelectedMake(null)
                    setActiveTab("All")
                  }}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-card border border-border/60 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setActiveTab("All")
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2.5 rounded-lg bg-card border border-border/60 text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all text-sm font-medium cursor-pointer"
              >
                <option value="name-asc">Sort: A–Z</option>
                <option value="name-desc">Sort: Z–A</option>
                <option value="count-desc">Most Parts</option>
                <option value="count-asc">Least Parts</option>
              </select>
            </div>

            {/* Search Result Count */}
            {searchQuery && (
              <div className="text-xs text-muted-foreground">
                Found {filteredMakes.length} {filteredMakes.length === 1 ? "brand" : "brands"} matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          {/* Top 3 Brands (shown only when no search) */}
          {topBrands.length > 0 && (
            <div className="mb-8 sm:mb-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-1 bg-primary rounded-full" />
                <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Top Brands</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topBrands.map((brand) => {
                  const slug = makeToSlug(brand)
                  const count = BRAND_COUNTS[slug] || 0
                  const href = CATALOG_SLUGS.has(slug) ? `/brands/${slug}` : `/makes/${encodeURIComponent(slug)}`
                  return (
                    <Link
                      key={brand}
                      href={href}
                      className="group flex items-center gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-all"
                    >
                      <MakeLogo brand={brand} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-sm">{brand}</div>
                        <div className="text-xs text-muted-foreground">{count.toLocaleString()} parts</div>
                      </div>
                      <Eye className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* A–Z Tab Bar (disabled when searching) */}
          {searchQuery === "" && (
            <div className="flex flex-wrap gap-1 mb-4 sm:mb-6" role="tablist" aria-label="Filter brands by letter">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => { setActiveTab(tab); setSelectedMake(null) }}
                  className={`min-w-[36px] h-8 px-2.5 rounded text-[11px] font-bold tracking-wide transition-all ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
                      : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* Brands Grid - Enhanced with Embossed Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-12" role="tabpanel">
            {filteredMakes.map((make) => {
              const isActive = selectedMake === make
              const slug = makeToSlug(make)
              const hasCatalog = CATALOG_SLUGS.has(slug)
              const count = BRAND_COUNTS[slug] || 0
              const href = hasCatalog ? `/brands/${slug}` : `/makes/${encodeURIComponent(slug)}`
              return (
                <Link
                  key={make}
                  href={href}
                  onClick={(e) => {
                    if (hasCatalog) return
                    if (isActive) {
                      e.preventDefault()
                      setSelectedMake(null)
                    } else {
                      setSelectedMake(make)
                    }
                  }}
                  className={`group relative flex flex-col gap-4 p-6 rounded-xl border-2 transition-all cursor-pointer ${
                    isActive
                      ? "border-slate-400 bg-gradient-to-b from-slate-200 to-slate-300 text-slate-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.4)]"
                      : "border-slate-600 bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.6)] hover:border-slate-500 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.5),0_8px_20px_rgba(0,0,0,0.8)]"
                  }`}
                >
                  {/* Header: Logo + Brand Name + Parts Count */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className={`text-sm sm:text-base font-black uppercase tracking-wider leading-tight mb-1 ${isActive ? "text-slate-900" : "text-white"}`}>
                        {make}
                      </h3>
                      <div className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block ${
                        isActive 
                          ? "bg-slate-400/40 text-slate-900"
                          : getCountBadgeColor(count)
                      }`}>
                        {count.toLocaleString()} parts
                      </div>
                    </div>
                    <MakeLogo brand={make} size="sm" />
                  </div>

                  {/* Icons: Engines & Transmissions */}
                  <div className={`flex items-center gap-4 text-xs font-semibold ${isActive ? "text-slate-700" : "text-muted-foreground"}`}>
                    <div className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 shrink-0" />
                      <span>Used Engines</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 shrink-0" />
                      <span>Transmissions</span>
                    </div>
                  </div>

                  {/* Browse Link */}
                  <div className={`text-sm font-bold flex items-center gap-1.5 group/link ${isActive ? "text-slate-900" : "text-white"}`}>
                    <span className="group-hover/link:underline">Browse {make} parts</span>
                    <span className="text-lg group-hover/link:translate-x-0.5 transition-transform">›</span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Featured: Acura Parts full catalog link — after all makes */}
          <Link
            href="/acura"
            className="group flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-primary/40 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-5 sm:p-6 mb-8 sm:mb-12 hover:border-primary/70 hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-4">
              <MakeLogo brand="Acura" size="lg" />
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">Acura Parts Catalog</h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  Browse our full Acura inventory with detailed product listings, pricing, and every available model.
                </p>
              </div>
            </div>
            <span className="auapw-btn auapw-btn-blue inline-flex items-center justify-center gap-2 px-5 py-3 text-[0.68rem] font-bold tracking-[0.18em] uppercase rounded-sm shrink-0">
              <Eye className="w-3.5 h-3.5" /> View Acura Parts
            </span>
          </Link>

          {/* Selected Make Detail */}
          {selectedMake && (
            <div className="glass-card rounded-lg p-4 sm:p-8 mb-8 sm:mb-12">
              <div className="metal-line mb-4 sm:mb-6" />
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <MakeLogo brand={selectedMake} size="lg" />
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">{selectedMake}</h2>
                  <p className="text-xs text-muted-foreground">{models.length} models available</p>
                </div>
              </div>

              <h3 className="text-sm font-bold tracking-wide text-foreground mb-4 uppercase">Available Models</h3>
              <div className="flex flex-wrap gap-2 mb-8">
                {models.map((model) => (
                  <Link
                    key={model}
                    href={`/search?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(model)}`}
                    className="inline-flex items-center px-4 py-2 border border-border/50 bg-secondary/30 text-xs font-semibold text-muted-foreground rounded-sm hover:bg-primary/10 hover:border-primary/40 hover:text-foreground transition-all"
                  >
                    {model}
                  </Link>
                ))}
              </div>

              <h3 className="text-sm font-bold tracking-wide text-foreground mb-4 uppercase">Parts Categories</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PART_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/search?make=${encodeURIComponent(selectedMake)}&part=${encodeURIComponent(cat.parts[0])}`}
                    className="glass-card rounded-sm p-4 hover:-translate-y-0.5 transition-all hover:border-primary/30"
                  >
                    <div className="text-sm font-bold text-foreground mb-1">{cat.label}</div>
                    <div className="text-[10px] text-muted-foreground">{cat.parts.length} parts</div>
                  </Link>
                ))}
              </div>

              <div className="flex gap-3 mt-8 flex-wrap">
                <Link href={`/search?make=${encodeURIComponent(selectedMake)}`} className="auapw-btn auapw-btn-blue inline-flex items-center justify-center gap-2 px-5 py-3 text-[0.68rem] font-bold tracking-[0.18em] uppercase rounded-sm">
                  <Search className="w-3.5 h-3.5" /> Search {selectedMake} Parts
                </Link>
                <a href="tel:+18888874199" className="inline-flex items-center justify-center gap-2 px-5 py-3 text-[0.65rem] font-bold tracking-[0.18em] uppercase border border-border/60 text-muted-foreground rounded-sm hover:border-foreground/50 hover:text-foreground transition-all">
                  <Phone className="w-3 h-3" /> Call 1-888-887-4199
                </a>
              </div>
            </div>
          )}

          {!selectedMake && (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">Select a brand above to see available models and search for parts.</p>
            </div>
          )}
        </div>

        <BrandLogosSection />
      </main>
      <Footer />
    </>
  )
}
