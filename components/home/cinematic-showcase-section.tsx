import Link from "next/link"
import Image from "next/image"
import { Search, Phone, ShieldCheck, Truck, DollarSign } from "lucide-react"

const FRAMES = [
  { src: "/images/hero-warehouse.png", alt: "Nationwide used auto parts warehouse" },
  { src: "/images/hero-engines.png", alt: "Quality-tested used engines" },
  { src: "/images/hero-parts-assembly.png", alt: "Precision parts assembly line" },
]

const STATS = [
  { icon: Truck, value: "$240", label: "Shipping Per Part" },
  { icon: ShieldCheck, value: "90", label: "Day Warranty" },
  { icon: DollarSign, value: "40–70%", label: "Cost Savings" },
]

export function CinematicShowcaseSection() {
  return (
    <section className="relative bg-[#3a3d44] py-16 sm:py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Section heading */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="live-dot w-2 h-2 rounded-full bg-destructive" />
            <span className="text-[0.65rem] font-black tracking-[0.3em] uppercase text-primary">
              Shop Used Auto Parts Online
            </span>
          </div>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,3rem)] font-bold text-foreground text-3d-section text-balance">
            The Engine of American Auto Recycling
          </h2>
        </div>

        {/* Cinematic video-style frame */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden border border-primary/15 shadow-2xl">
          {/* Ken Burns rotating frames */}
          {FRAMES.map((frame) => (
            <div key={frame.src} className="cinematic-frame">
              <div className="relative w-full h-full cinematic-img">
                <Image
                  src={frame.src}
                  alt={frame.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  priority
                />
              </div>
            </div>
          ))}

          {/* Cinematic overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/25 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/30 pointer-events-none" />

          {/* Letterbox bars for film feel */}
          <div className="absolute top-0 inset-x-0 h-6 sm:h-8 bg-black/70 pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-6 sm:h-8 bg-black/70 pointer-events-none" />

          {/* LIVE badge */}
          <div className="absolute top-9 sm:top-11 left-4 sm:left-6 flex items-center gap-2 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1.5 border border-white/15">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-destructive" />
            <span className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-white">Live Inventory</span>
          </div>

          {/* Overlaid content */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 z-10">
            <span className="text-[0.7rem] sm:text-[0.8rem] font-black tracking-[0.25em] uppercase text-white/70 mb-3">
              2,000+ Verified Yards · All 50 States
            </span>
            <h3
              className="text-[1.75rem] sm:text-[clamp(2rem,5vw,3.5rem)] font-black text-white leading-[1.05] max-w-3xl mb-6 drop-shadow-lg"
              style={{ fontFamily: "system-ui" }}
            >
              Millions of Quality Parts,
              <br />
              One Search Away
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/parts" className="auapw-btn auapw-btn-silver">
                <Search className="w-4 h-4" />
                <span>Find Your Part</span>
              </Link>
              <a href="tel:+18888874199" className="auapw-btn auapw-btn-green">
                <Phone className="w-4 h-4" />
                <span>Call 1-888-887-4199</span>
              </a>
            </div>
          </div>
        </div>

        {/* Stats strip beneath the reel */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5 mt-5 sm:mt-6">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center text-center gap-1.5 rounded-xl py-4 sm:py-5 px-2"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <span className="text-lg sm:text-2xl font-black text-white leading-none">{value}</span>
              <span className="text-[0.6rem] sm:text-[0.65rem] font-bold tracking-[0.15em] uppercase text-white/65">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
