import Link from "next/link"
import { Search, Phone, MessageSquare } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-20 text-center relative bg-gradient-to-br from-card via-secondary to-card">
      <div className="metal-line absolute top-0 left-0 right-0" />
      <div className="metal-line absolute bottom-0 left-0 right-0" />
      <div className="mx-auto max-w-[900px] px-6">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/50" />
          <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-primary">Your Trusted Partner</span>
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-primary/50" />
        </div>

        <p className="text-sm font-bold tracking-[0.15em] text-muted-foreground uppercase mb-5">
          For All Vehicles &middot; Automotive Services & Solutions
        </p>
        <p className="text-muted-foreground text-sm max-w-[440px] mx-auto mb-10 leading-relaxed">
          Search our nationwide inventory network or speak directly with our team. Every request receives a response within 24 hours.
        </p>
        <div className="flex flex-wrap gap-4 justify-center items-center">
          <Link 
            href="/ai-search" 
            className="auapw-btn auapw-btn-blue"
          >
            <Search className="w-4 h-4" />
            <span>Search Parts Now</span>
          </Link>
          <a 
            href="tel:+18888874199" 
            className="auapw-btn auapw-btn-green"
          >
            <Phone className="w-4 h-4" />
            <span>1-888-887-4199</span>
          </a>
          <Link 
            href="/quote" 
            className="auapw-btn auapw-btn-amber"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Request Free Quote</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
