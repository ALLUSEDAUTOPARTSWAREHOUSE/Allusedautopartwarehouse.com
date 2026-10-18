import Link from "next/link"
import { CAR_MAKES, PART_CATEGORIES, PHONE_DISPLAY, CONTACT_EMAIL } from "@/lib/data"
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react"
import { BrandWordmark } from "@/components/brand-wordmark"
import { Logo } from "@/components/logo"

export function Footer() {
  const popularPartLinks = [
    { label: "Complete Engine", href: "/parts/engines" },
    { label: "Long Block Engine", href: "/parts/engines" },
    { label: "Automatic Transmission", href: "/parts/transmissions" },
    { label: "Manual Transmission", href: "/parts/transmissions" },
    { label: "Axle Assembly Front", href: "/parts/drivetrain" },
    { label: "Axle Assembly Rear", href: "/parts/drivetrain" },
    { label: "Alternator", href: "/parts/electrical" },
    { label: "Starter Motor", href: "/parts/electrical" },
    { label: "Radiator", href: "/parts/cooling" },
    { label: "AC Compressor", href: "/parts/cooling" },
  ]
  const popularMakes = CAR_MAKES.slice(0, 8)

  return (
    <footer className="bg-gradient-to-br from-slate-900/40 to-slate-800/30 backdrop-blur-xl border-t border-white/10 relative overflow-hidden w-full automotive-pattern">
      {/* Top brand strip with logos */}
      <div className="border-b border-white/10 bg-gradient-to-r from-white/5 via-white/3 to-transparent backdrop-blur-lg py-2 sm:py-3 md:py-4 overflow-x-auto">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <span className="text-[8px] sm:text-[9px] font-black tracking-[0.15em] uppercase text-3d-subtle whitespace-nowrap">Popular Brands</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>
          <div className="flex flex-wrap gap-[3px] sm:gap-1 md:gap-1.5">
            {CAR_MAKES.slice(0, 12).map((brand) => (
              <Link
                key={brand}
                href={`/makes/${encodeURIComponent(brand.toLowerCase().replace(/\s+/g, "-"))}`}
                className="chrome-brand-pill"
                title={`${brand} Parts`}
              >
                {brand}
              </Link>
            ))}
            <Link
              href="/makes"
              className="chrome-brand-pill"
              style={{ background: 'linear-gradient(165deg, rgba(120,160,200,0.4) 0%, rgba(40,80,120,0.3) 15%, rgba(15,25,40,0.95) 35%, rgba(8,15,25,1) 55%, rgba(12,20,35,0.97) 75%, rgba(40,80,120,0.3) 90%, rgba(120,160,200,0.4) 100%)', borderColor: 'rgba(100,150,200,0.4)', color: 'rgba(150,190,230,0.95)' }}
            >
              +More
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-14 py-10 sm:py-14 lg:py-20">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
              <Logo size="sm" variant="ring" />
              <BrandWordmark size="footer" />
            </div>
            <p className="text-xs sm:text-sm leading-6 sm:leading-7 text-muted-foreground mb-6 sm:mb-8 font-semibold tracking-tight">
              Premium quality used auto parts from 2,000+ verified yards nationwide. 90-day warranty on every part.
            </p>
            <div className="space-y-2.5 sm:space-y-3">
              <a href="tel:+18888874199" className="auapw-btn auapw-btn-green auapw-btn-sm w-full">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">1-888-887-4199</span>
              </a>
              <a href="mailto:support@auapw.com" className="auapw-btn auapw-btn-teal auapw-btn-sm w-full">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">support@auapw.com</span>
              </a>
              <a href="mailto:info@auapw.com" className="auapw-btn auapw-btn-blue auapw-btn-sm w-full">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">info@auapw.com</span>
              </a>
              <a href="https://maps.google.com/?q=508+S+Elm+St+Ste+104+Denton+TX+76201" target="_blank" rel="noopener noreferrer" className="auapw-btn auapw-btn-silver auapw-btn-sm w-full">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Denton, TX</span>
              </a>
            </div>
            
            {/* Social Media Links */}
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border/20">
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground mb-4">Follow Us</p>
              <div className="flex gap-3">
                {[
                  { icon: Facebook, href: "https://facebook.com/auapw", label: "Facebook" },
                  { icon: Twitter, href: "https://twitter.com/auapw", label: "Twitter" },
                  { icon: Instagram, href: "https://instagram.com/auapw", label: "Instagram" },
                  { icon: Linkedin, href: "https://linkedin.com/company/auapw", label: "LinkedIn" },
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200 border border-primary/30 hover:border-primary/60"
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Popular Parts */}
          <div className="embossed-col p-3 sm:p-5">
            <h3 className="text-xs sm:text-sm font-black tracking-[0.2em] uppercase text-foreground text-3d-section mb-4 sm:mb-6 pb-2 sm:pb-3 border-b-2 border-primary/50 inline-block">
              Popular Parts
            </h3>
            <ul className="space-y-2 sm:space-y-3" style={{ textTransform: 'uppercase' }}>
              {popularPartLinks.slice(0, 5).map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-all duration-200 flex items-center gap-2 font-bold tracking-tight text-3d-subtle">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/70 hover:bg-primary transition-colors flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Makes */}
          <div className="embossed-col p-3 sm:p-5">
            <h3 className="text-xs sm:text-sm font-black tracking-[0.2em] uppercase text-foreground text-3d-section mb-4 sm:mb-6 pb-2 sm:pb-3 border-b-2 border-primary/50 inline-block">
              Popular Makes
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {popularMakes.map((make) => (
                <li key={make}>
                  <Link 
                    href={`/makes/${encodeURIComponent(make.toLowerCase().replace(/\s+/g, "-"))}`} 
                    className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-all duration-200 flex items-center gap-2 font-bold tracking-tight text-3d-subtle"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/70 hover:bg-primary transition-colors flex-shrink-0" />
                    <span>{make}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="embossed-col p-3 sm:p-5">
            <h3 className="text-xs sm:text-sm font-black tracking-[0.2em] uppercase text-foreground text-3d-section mb-4 sm:mb-6 pb-2 sm:pb-3 border-b-2 border-primary/50 inline-block">
              Quick Links
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {[
                { label: "Used Engines", href: "/used-engines" },
                { label: "Used Transmissions", href: "/used-transmissions" },
                { label: "Inventory", href: "/inventory" },
                { label: "All Parts", href: "/parts" },
                { label: "Car Brands", href: "/makes" },
                { label: "Blog", href: "/blog" },
                { label: "Get A Quote", href: "/quote" },
                { label: "About Us", href: "/about" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-all duration-200 font-bold tracking-tight text-3d-subtle">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div className="embossed-col p-3 sm:p-5">
            <h3 className="text-xs sm:text-sm font-black tracking-[0.2em] uppercase text-foreground text-3d-section mb-4 sm:mb-6 pb-2 sm:pb-3 border-b-2 border-primary/50 inline-block">
              Policies &amp; Legal
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {[
                { label: "Privacy Policy", href: "/privacy-policy" },
                { label: "Terms & Conditions", href: "/terms" },
                { label: "Shipping Policy", href: "/shipping-policy" },
                { label: "Return Policy", href: "/return-policy" },
                { label: "Cookie Policy", href: "/cookie-policy" },
                { label: "Disclaimer", href: "/disclaimer" },
                { label: "Acceptable Use", href: "/acceptable-use" },
                { label: "Contact", href: "/contact" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-all duration-200 font-bold tracking-tight text-3d-subtle">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-gradient-to-r from-white/5 via-white/3 to-white/5 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-5 sm:py-7 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
          <span className="text-xs sm:text-sm text-muted-foreground font-semibold tracking-tight text-center sm:text-left text-3d-subtle">
            &copy; {new Date().getFullYear()} <strong className="font-black text-foreground text-3d-bold">AUAPW LLC</strong>
          </span>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {[
              { label: "Terms", href: "/terms" },
              { label: "Privacy", href: "/privacy-policy" },
              { label: "Shipping", href: "/shipping-policy" },
              { label: "Returns", href: "/return-policy" },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-all duration-200 font-semibold tracking-tight text-3d-subtle">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
