import Link from "next/link"
import Image from "next/image"
import { PART_CATEGORIES } from "@/lib/data"
import { CircleDot, Link2, Zap, Snowflake, Activity, Square } from "lucide-react"

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  transmissions: CircleDot,
  drivetrain: Link2,
  electrical: Zap,
  cooling: Snowflake,
  suspension: Activity,
  body: Square,
}

const CATEGORY_IMAGES: Record<string, string> = {
  engines: "/images/category-engines.png",
  transmissions: "/images/category-transmissions.png",
  drivetrain: "/images/category-drivetrain.png",
  electrical: "/images/category-electrical.png",
  cooling: "/images/category-cooling.png",
  brakes: "/images/category-brakes.png",
  suspension: "/images/category-suspension.png",
}

export function CategoriesSection() {
  return (
    <section className="py-20 bg-[#3a3d44]">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-10 sm:mb-14">
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/50" />
              <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-primary">What We Source</span>
            </div>
            <h2 className="font-serif text-[clamp(1.75rem,4vw,3rem)] font-bold intelligent-premium-text text-3d-section text-balance">Parts Categories</h2>
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {PART_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id]
            const categoryImage = CATEGORY_IMAGES[cat.id]
            return (
              <Link
                key={cat.id}
                href={`/parts/${cat.id}`}
                className="group glass-card rounded-sm overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
              >
                {/* Product Image */}
                {categoryImage && (
                  <div className="w-full h-40 mb-4 overflow-hidden rounded-sm relative bg-black/20">
                    <Image
                      src={categoryImage}
                      alt={cat.label}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                {/* Content */}
                <div className="p-7 pt-3">
                  {cat.id === 'engines' ? (
                    <div className="w-8 h-8 mb-4 object-cover">
                      <img src="/images/icon-gear.png" alt={cat.label} className="w-full h-full" />
                    </div>
                  ) : Icon ? (
                    <Icon className="w-7 h-7 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                  ) : null}
                  <h3 className="text-[15px] font-bold tracking-wide text-foreground mb-2">{cat.label}</h3>
                  <p className="text-[11px] text-muted-foreground mb-4">{cat.parts.length} parts available</p>
                  <div className="border-t border-border/30 pt-3 flex flex-wrap gap-1.5">
                    {cat.parts.slice(0, 3).map((p) => (
                      <span key={p} className="px-2.5 py-1 bg-secondary/50 border border-border/40 text-[10px] text-muted-foreground rounded-sm">{p}</span>
                    ))}
                    <span className="px-2.5 py-1 bg-secondary/50 border border-border/40 text-[10px] text-muted-foreground rounded-sm">+{cat.parts.length - 3}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
