import Link from "next/link"
import { GearBackground } from "@/components/gear-background"
import { BrandWordmark } from "@/components/brand-wordmark"
import { BrandEmblem3D } from "@/components/brand-emblem-3d"
import { Logo } from "@/components/logo"
import Image from "next/image"
import { HeroSlider } from "@/components/home/hero-slider"
import { Search, MessageSquare, Phone, Mail, Cog, Settings2, Calendar } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative pt-[58px] overflow-hidden ghost-scan-section hero-on-dark" style={{ paddingTop: "45px" }}>
      {/* Background — grey base; photo carousel constrained to the top hero band */}
      <div className="absolute inset-0 bg-[#3a3d44]">
        <div className="absolute top-0 inset-x-0 h-[820px] overflow-hidden">
          <HeroSlider />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#3a3d44]" />
        </div>
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.05] pointer-events-none" style={{ background: "radial-gradient(circle, #e8e8e8 0%, transparent 70%)" }} />
        <GearBackground />
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize: "100px" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="flex flex-col items-center py-10 sm:py-16 lg:py-24 gap-8 sm:gap-10">

          {/* Brand column — full width, centered */}
          <div className="fade-up w-full flex flex-col items-center gap-5 sm:gap-7 rounded-xl sm:rounded-2xl p-6 sm:p-10 lg:p-14 text-center">
            {/* Logo + Wordmark — ULTRA brand block */}
            <div className="flex flex-col items-center gap-16 sm:gap-20 w-full py-14 pb-0">
              {/* Ultra-massive logo */}
              <Logo size="4xl" variant="medallion" priority showGlow />
              {/* Ultra wordmark */}
              <BrandWordmark 
                size="hero-5xl" 
                className="text-center items-center on-dark"
              />
            </div>

            {/* Headline */}
            <h1 className="font-sans leading-tight text-balance max-w-4xl" style={{ fontFamily: "system-ui" }}>
              <span className="block text-[0.75rem] sm:text-[1rem] font-black tracking-[0.25em] uppercase text-white/70 mb-3" style={{ fontFamily: "system-ui" }}>Your Trusted Partner</span>
              <span
                className="block text-[1.8rem] sm:text-[clamp(2rem,5vw,3.8rem)] font-black"
                style={{
                  fontFamily: "system-ui",
                  backgroundImage:
                    "linear-gradient(90deg,#c8cdda 0%,#eef1f8 30%,#ffffff 50%,#eef1f8 70%,#c8cdda 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
                }}
              >
                Premium Quality Used Auto Parts
              </span>
            </h1>

            {/* Key stats */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 text-center">
              {[
                { value: "2,000+", label: "Verified Yards" },
                { value: "90", label: "Day Warranty" },
                { value: "24hr", label: "Response Time" },
                { value: "50", label: "States Covered" },
              ].map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <span className="text-[1.4rem] sm:text-[1.8rem] font-black text-white">{value}</span>
                  <span className="text-[0.6rem] sm:text-[0.65rem] font-bold tracking-[0.18em] uppercase text-white/70">{label}</span>
                </div>
              ))}
            </div>

            {/* Feature highlights grid */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-left mt-2">
              {[
                { title: "Fast 24-Hour Response", desc: "After choosing your desired used engines and used transmissions and contacting a dealer, you will receive a response in less than 24 hours. All you need is internet access – no need to roam around different junkyards to find a car part – we do it all for you." },
                { title: "Nationwide US Coverage", desc: "We partner with 2,000+ top-rated junkyards and salvage yards across all 50 states, giving you access to the largest network of quality used auto parts in the United States." },
                { title: "User-Friendly Search", desc: "Our intuitive search tool connects you instantly with qualified suppliers. Simply enter your vehicle details and find the exact part you need – no phone calls, no driving around." },
                { title: "Verified Supplier Network", desc: "Every yard in our network is vetted for quality, reliability, and customer service. We connect you only with trusted suppliers who meet our strict standards." },
                { title: "Hassle-Free Experience", desc: "Skip the traditional junkyard search. Our platform handles the hard work – sourcing, verifying, and coordinating – so you get quality parts delivered right to your door." },
                { title: "Competitive Pricing", desc: "Save 40-70% compared to new OEM parts. Transparent quotes with no hidden fees – straightforward pricing from trusted US-based suppliers." },
                { title: "Quality Guaranteed", desc: "All parts undergo certified inspections before shipping. Every part comes with a 90-day warranty for your peace of mind." },
                { title: "Dealer & DIY Friendly", desc: "Whether you are a professional mechanic or a DIY enthusiast, our platform provides the same premium access, expert support, and seamless ordering experience." },
              ].map(({ title, desc }) => (
                <div key={title}
                  className="flex flex-col gap-1 p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <span className="text-sm font-bold tracking-tight text-primary">{title}</span>
                  <span className="text-sm font-semibold tracking-tight text-foreground leading-relaxed" style={{ fontFamily: "system-ui" }}>{desc}</span>
                </div>
              ))}
            </div>

            {/* Why Buy Parts Online */}
            <div className="w-full mt-4 pt-6 border-t border-white/10">
              <h2 className="text-primary font-bold tracking-tight text-center text-lg sm:text-xl mb-4 uppercase">Your Trusted US-Based Auto Parts Platform</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                {[
                  {
                    title: "America's Largest Parts Network",
                    body: "AUAPW LLC connects you with over 2,000 top junkyards and salvage yards across the United States. Our extensive network ensures you find the right part, whether it is a common component or a rare discontinued item."
                  },
                  {
                    title: "Seamless Search Experience",
                    body: "Our user-friendly search tool makes finding used auto parts effortless. Enter your vehicle details, browse available options, and connect with qualified suppliers – all from the comfort of your home or shop."
                  },
                  {
                    title: "Reliable Supplier Connections",
                    body: "We serve as your trusted connector to pre-qualified suppliers nationwide. Every yard in our network is verified for quality and reliability, ensuring you receive top-quality service and genuine OEM parts."
                  },
                ].map(({ title, body }) => (
                  <div key={title}
                    className="p-4 rounded-lg flex flex-col gap-2"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                  >
                    <span className="text-sm font-bold tracking-tight text-primary">{title}</span>
                    <p className="text-sm font-semibold tracking-tight text-foreground leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What Are the Benefits */}
            <div className="w-full pt-6 border-t border-white/10">
              <h2 className="text-primary font-bold tracking-tight text-center text-lg sm:text-xl mb-4 uppercase">Benefits of Choosing AUAPW LLC</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {[
                  {
                    title: "90-Day Warranty on Every Part",
                    body: "All used parts come with a clear 90-day warranty. This set protection window gives you confidence that you are covered after purchase."
                  },
                  {
                    title: "Certified Quality Inspections",
                    body: "Parts are subject to certified quality inspections to verify condition and functionality before they ship. Our inspection process is designed so you receive parts that meet expected performance standards."
                  },
                  {
                    title: "24-Hour Response Time",
                    body: "We aim to respond to every inquiry within 24 hours to keep your repair project moving. Fast replies help you confirm availability, arrange shipping, or get technical support without long wait times."
                  },
                  {
                    title: "Expert Technical Support",
                    body: "Our support team answers questions about fitment, compatibility, and installation basics. Whether you are a professional installer or a DIY buyer, we provide practical guidance to make the job go smoothly."
                  },
                  {
                    title: "Environmentally Responsible",
                    body: "Choosing used auto parts supports responsible recycling and reduces the environmental impact of vehicle repairs. Our network prioritizes reuse and recycling to lower automotive waste nationwide."
                  },
                  {
                    title: "Dealer and DIY Friendly",
                    body: "Our services are built for both professional dealers and independent DIY customers. You get the same access to quality inventory and support whether you are running a shop or fixing your own vehicle."
                  },
                ].map(({ title, body }) => (
                  <div key={title}
                    className="p-4 rounded-lg flex flex-col gap-2"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                  >
                    <span className="text-sm font-bold tracking-tight text-primary">{title}</span>
                    <p className="text-sm font-semibold tracking-tight text-foreground leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="w-full pt-6 border-t border-white/10">
              <h2 className="text-primary font-bold tracking-tight text-center text-lg sm:text-xl mb-4 uppercase">How It Works</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">

                {/* Step 01 */}
                <div className="p-4 rounded-lg flex flex-col items-center gap-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <span className="text-2xl font-bold tracking-tight text-primary/40">01</span>
                  <span className="text-sm font-bold tracking-tight text-primary uppercase">Search Your Part</span>
                  <p className="text-sm font-semibold tracking-tight text-foreground leading-relaxed">Enter your vehicle year, make, model, and the part you need to get matched results instantly.</p>
                  <Link href="/parts" className="mt-auto w-full auapw-btn auapw-btn-silver auapw-btn-sm">
                    <Search className="w-4 h-4" />
                    <span>Find Your Part</span>
                  </Link>
                </div>

                {/* Step 02 */}
                <div className="p-4 rounded-lg flex flex-col items-center gap-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <span className="text-2xl font-bold tracking-tight text-primary/40">02</span>
                  <span className="text-sm font-bold tracking-tight text-primary uppercase">Get a Free Quote</span>
                  <p className="text-sm font-semibold tracking-tight text-foreground leading-relaxed">Receive a transparent, no-obligation quote from our verified network with clear pricing upfront.</p>
                  <Link href="/quote" className="mt-auto w-full auapw-btn auapw-btn-blue auapw-btn-sm">
                    <MessageSquare className="w-4 h-4" />
                    <span>Free Quote</span>
                  </Link>
                </div>

                {/* Step 03 */}
                <div className="p-4 rounded-lg flex flex-col items-center gap-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <span className="text-2xl font-bold tracking-wide text-primary/40">03</span>
                  <span className="text-sm font-bold tracking-wide text-primary uppercase">Confirm &amp; Order</span>
                  <p className="text-sm font-bold tracking-wide text-foreground leading-relaxed">Review availability, warranty details, and shipping options, then confirm your order with ease.</p>
                  <a href="tel:+18888874199" className="mt-auto w-full auapw-btn auapw-btn-green auapw-btn-sm">
                    <Phone className="w-4 h-4" />
                    <span>Call &amp; Order</span>
                  </a>
                </div>

                {/* Step 04 */}
                <div className="p-4 rounded-lg flex flex-col items-center gap-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <span className="text-2xl font-bold tracking-wide text-primary/40">04</span>
                  <span className="text-sm font-bold tracking-wide text-primary uppercase">Fast Delivery</span>
                  <p className="text-sm font-bold tracking-wide text-foreground leading-relaxed">Your part ships same day when available, delivered directly to your door or local shop.</p>
                  <a href="mailto:support@allusedautopartswarehouse.com" className="mt-auto w-full auapw-btn auapw-btn-teal auapw-btn-sm">
                    <Mail className="w-4 h-4" />
                    <span>Email Us</span>
                  </a>
                </div>

              </div>
            </div>

            {/* About AUAPW */}
            <div className="w-full pt-6 border-t border-white/10">
              <h2 className="text-primary font-bold tracking-wide text-center text-lg sm:text-xl mb-4 uppercase">Your Trusted Partner for Used Auto Parts</h2>
              <p className="text-sm font-bold tracking-wide text-foreground leading-relaxed text-center max-w-3xl mx-auto">
                We are your trusted partner for finding the right used auto parts, and we work to build a long-term relationship based on reliability and service. Our parts and services cover a wide range of vehicles and common automotive needs — from routine repairs to more complex solutions. Whether you are working on a family car, truck, or specialty vehicle, we have options to help you complete the job. With nationwide coverage across all 50 states and local pickup options when available, you can source parts no matter where you are located in the country.
              </p>
            </div>

            {/* Used Engines / Used Transmissions / Book Appointment — 3-column */}
            <div className="w-full pt-6 border-t border-white/10">
              <h2 className="text-primary font-bold tracking-wide text-center text-lg sm:text-xl mb-6 uppercase">Used Engines · Used Transmissions · Truck Parts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">

                {/* Used Engines */}
                <div className="flex flex-col gap-4 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <div className="relative w-full h-44 overflow-hidden">
                    <Image src="/images/section-used-engines.png" alt="Used Engines" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <span className="absolute bottom-3 left-4 text-white font-bold tracking-wide text-base uppercase drop-shadow">Used Engines</span>
                  </div>
                  <div className="flex flex-col gap-4 p-5 pt-2">
                  <span className="text-primary font-bold tracking-wide text-base uppercase sr-only">Used Engines</span>
                  <p className="text-sm font-bold tracking-wide text-foreground leading-relaxed">
                    Our used engines are pulled from low-mileage donor vehicles, inspected for compression, leaks, and overall condition before they ship. Whether you need a replacement engine for a sedan, SUV, or truck, we source the right match for your year, make, and model. Every engine comes with a 90-day warranty so you have coverage after installation.
                  </p>
                  <ul className="flex flex-col gap-1">
                    {["All major domestic and import makes", "Low-mileage verified units", "Compression and leak tested", "Matched by VIN or engine code", "Warranty included on all units"].map(item => (
                      <li key={item} className="text-sm font-bold tracking-wide text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">›</span>{item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/used-engines" className="mt-auto w-full auapw-btn auapw-btn-red">
                    <Cog className="w-4 h-4" />
                    <span>Used Engines</span>
                  </Link>
                  </div>
                </div>

                {/* Used Transmissions */}
                <div className="flex flex-col gap-4 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <div className="relative w-full h-44 overflow-hidden">
                    <Image src="/images/section-used-transmissions.png" alt="Used Transmissions" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <span className="absolute bottom-3 left-4 text-white font-bold tracking-wide text-base uppercase drop-shadow">Used Transmissions</span>
                  </div>
                  <div className="flex flex-col gap-4 p-5 pt-2">
                  <span className="text-primary font-bold tracking-wide text-base uppercase sr-only">Used Transmissions</span>
                  <p className="text-sm font-bold tracking-wide text-foreground leading-relaxed">
                    We carry automatic and manual used transmissions for cars, trucks, and SUVs. Each unit is tested for proper shifting, gear engagement, and fluid integrity before it leaves the yard. Get a direct-fit replacement at a fraction of dealership or rebuild cost without sacrificing reliability or quality.
                  </p>
                  <ul className="flex flex-col gap-1">
                    {["Automatic and manual available", "Shift and engagement tested", "All makes and models covered", "Direct OEM fitment", "90-day warranty included"].map(item => (
                      <li key={item} className="text-sm font-bold tracking-wide text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">›</span>{item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/used-transmissions" className="mt-auto w-full auapw-btn auapw-btn-blue">
                    <Settings2 className="w-4 h-4" />
                    <span>Used Transmissions</span>
                  </Link>
                  </div>
                </div>

                {/* Book Appointment / Contact */}
                <div className="flex flex-col gap-4 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <div className="relative w-full h-44 overflow-hidden">
                    <Image src="/images/section-appointment.png" alt="Schedule a Callback" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <span className="absolute bottom-3 left-4 text-white font-bold tracking-wide text-base uppercase drop-shadow">Schedule a Callback</span>
                  </div>
                  <div className="flex flex-col gap-4 p-5 pt-2">
                  <span className="text-primary font-bold tracking-wide text-base uppercase sr-only">Schedule a Callback</span>
                  <p className="text-sm font-bold tracking-wide text-foreground leading-relaxed">
                    Tell us what time works best for you and we will call you back — on your schedule. Whether you need a quote, technical advice, or help finding a specific part, our team is ready to connect at the time you choose. No hold music. No waiting. Just real help when you need it.
                  </p>
                  <ul className="flex flex-col gap-1">
                    {["Pick your preferred callback time", "Available any day of the week", "Speak to a real parts specialist", "Get a quote over the phone", "No obligation — completely free"].map(item => (
                      <li key={item} className="text-sm font-bold tracking-wide text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">›</span>{item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-3 mt-auto">
                    <Link href="/quote" className="w-full auapw-btn auapw-btn-amber">
                      <Calendar className="w-4 h-4" />
                      <span>Schedule Callback</span>
                    </Link>
                    <a href="mailto:support@allusedautopartswarehouse.com" className="w-full auapw-btn auapw-btn-teal auapw-btn-sm">
                      <Mail className="w-4 h-4" />
                      <span>support@allusedautopartswarehouse.com</span>
                    </a>
                  </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 3D Emblem */}
            <div className="hidden lg:flex justify-center">
              <BrandEmblem3D effect="diamond-led" size="md" animated />
            </div>
          </div>


        </div>
      </div>
    </section>
  )
}
