import { GearBackground } from "@/components/gear-background"
import { Shield, Zap, Truck, Wrench, Phone } from "lucide-react"
import { BrandWordmark } from "@/components/brand-wordmark"
import { Logo } from "@/components/logo"

const BADGES = [
  { icon: Shield, label: "90-Day Warranty" },
  { icon: Zap, label: "24-Hr Response" },
  { icon: Truck, label: "All 50 States" },
  { icon: Wrench, label: "ASE-Certified" },
]

interface BrandBannerProps {
  subtitle?: string
}

export function BrandBanner({ subtitle }: BrandBannerProps) {
  return (
    <div className="relative overflow-hidden bg-[#080808] dark:bg-[#080808] border-b border-border/30 py-6 sm:py-8 lg:py-10 automotive-pattern">
      {/* Gear graphic background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <GearBackground />
        {/* Dark matte overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(8,8,8,0.55)] via-[rgba(8,8,8,0.4)] to-[rgba(8,8,8,0.7)]" />
      </div>

      <div className="metal-line absolute top-0 left-0 right-0" />
      <div className="metal-line absolute bottom-0 left-0 right-0" />

      <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 flex flex-col items-center gap-4 sm:gap-6">
        {/* Logo medallion */}
        <Logo size="xl" variant="medallion" priority showGlow />

        {/* Wordmark */}
        <BrandWordmark
          size="banner"
          subtitle={subtitle ? `"${subtitle}"` : undefined}
          className="on-dark"
        />

        {/* Chrome divider with gear icon */}
        <div className="flex items-center gap-3 w-full max-w-[480px]">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/50 to-border/70" />
          <svg
            width="18"
            height="18"
            viewBox="0 0 100 100"
            fill="currentColor"
            className="text-muted-foreground/40 shrink-0"
            aria-hidden="true"
          >
            <path d="M50,2 L64,4 L65,17 L75,24 L85,13 L93,24 L83,38 L86,50 L98,50 L96,64 L83,65 L76,75 L87,85 L76,93 L63,83 L50,86 L50,98 L36,96 L35,83 L25,76 L16,87 L8,76 L17,63 L14,50 L2,50 L4,36 L17,35 L24,25 L13,16 L24,8 L38,17Z M50,38a12,12 0 1 0 0,24a12,12 0 1 0 0-24Z" />
          </svg>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border/50 to-border/70" />
        </div>

        {/* Description */}
        <p className="text-[0.7rem] sm:text-[0.78rem] lg:text-[0.82rem] font-medium tracking-[0.04em] sm:tracking-[0.06em] text-muted-foreground/80 text-center leading-relaxed max-w-[520px] uppercase px-2">
          Quality Used Auto Parts · Engines · Transmissions · All Makes &amp; Models
        </p>

        {/* Trust badges — metal embossed */}
        <div className="flex flex-wrap justify-center gap-x-2 sm:gap-x-5 gap-y-1.5 sm:gap-y-2 pt-0.5">
          {BADGES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="text-[0.5rem] sm:text-[0.58rem] font-bold tracking-[0.12em] sm:tracking-[0.18em] uppercase text-muted-foreground/70 flex items-center gap-1 sm:gap-1.5 rounded-sm px-1.5 sm:px-2.5 py-0.5 sm:py-1 embossed-col metal-icon-wrap"
            >
              <Icon className="w-2 h-2 sm:w-2.5 sm:h-2.5 shrink-0" />
              {label}
            </span>
          ))}
        </div>

        {/* Mobile CTA Button — luxury call button with mercury LED on phones */}
        <a
          href="tel:+18888874199"
          className="sm:hidden w-full luxury-phone-cta justify-center mercury-led-text font-bold"
        >
          <Phone className="luxury-phone-cta-icon" />
          Call Now
        </a>
      </div>
    </div>
  )
}
