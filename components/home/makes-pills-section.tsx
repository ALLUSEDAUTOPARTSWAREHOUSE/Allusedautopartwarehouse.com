import Link from "next/link"
import { CAR_MAKES } from "@/lib/data"

export function MakesPillsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-background via-card to-background border-b border-border/30">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex items-end justify-between gap-6 mb-12 flex-wrap">
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/50" />
              <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-primary">All Makes & Models</span>
            </div>
            <div>
              <h2 className="font-serif text-[clamp(1.75rem,4vw,3rem)] font-bold text-foreground text-balance mb-1">Shop by Brand</h2>
              <p className="text-muted-foreground text-xs sm:text-sm font-semibold tracking-tight">Quality used parts for every make — {CAR_MAKES.length} brands, 2,000+ verified yards</p>
            </div>
          </div>
          <Link href="/makes" className="inline-flex items-center justify-center gap-2 px-5 py-3 text-[0.68rem] font-bold tracking-[0.18em] uppercase border border-border/60 text-muted-foreground rounded-sm hover:border-foreground/50 hover:text-foreground transition-all shrink-0">
            View All Makes &rarr;
          </Link>
        </div>
        <div className="flex flex-wrap gap-[3px] sm:gap-1 md:gap-1.5">
          {CAR_MAKES.map((make) => (
            <Link
              key={make}
              href={`/makes/${encodeURIComponent(make.toLowerCase().replace(/\s+/g, "-"))}`}
              className="chrome-brand-pill"
              title={`${make} Parts`}
            >
              {make}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
