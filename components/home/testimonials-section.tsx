import { TESTIMONIALS } from "@/lib/data"
import { Star } from "lucide-react"

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex items-end justify-between gap-6 mb-14 flex-wrap">
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/50" />
              <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-primary">Customer Reviews</span>
            </div>
            <h2 className="font-serif text-[clamp(1.75rem,4vw,3rem)] font-bold text-foreground text-3d-section text-balance">What Clients Say</h2>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-foreground text-foreground" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">5.0 average</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="glass-card rounded-sm p-7 flex flex-col transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_32px_rgba(0,0,0,0.5)]">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3 h-3 fill-foreground text-foreground" />
                ))}
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed italic flex-1 mb-5">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="border-t border-border/30 pt-4">
                <div className="text-[13px] font-bold text-foreground">{t.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{t.location}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
