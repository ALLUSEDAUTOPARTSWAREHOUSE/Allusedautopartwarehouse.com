'use client'

import { Clock, Globe, Search, ShieldCheck, Zap, DollarSign, BadgeCheck, Wrench } from 'lucide-react'

const features = [
  {
    icon: Clock,
    title: 'Fast 24-Hour Response',
    description: 'After choosing your desired used engines and used transmissions and contacting a dealer, you will receive a response in less than 24 hours. All you need is internet access – no need to roam around different junkyards to find a car part – we do it all for you.'
  },
  {
    icon: Globe,
    title: 'Nationwide US Coverage',
    description: 'We partner with 2,000+ top-rated junkyards and salvage yards across all 50 states, giving you access to the largest network of quality used auto parts in the United States.'
  },
  {
    icon: Search,
    title: 'User-Friendly Search',
    description: 'Our intuitive search tool connects you instantly with qualified suppliers. Simply enter your vehicle details and find the exact part you need – no phone calls, no driving around.'
  },
  {
    icon: ShieldCheck,
    title: 'Verified Supplier Network',
    description: 'Every yard in our network is vetted for quality, reliability, and customer service. We connect you only with trusted suppliers who meet our strict standards.'
  },
  {
    icon: Zap,
    title: 'Hassle-Free Experience',
    description: 'Skip the traditional junkyard search. Our platform handles the hard work – sourcing, verifying, and coordinating – so you get quality parts delivered right to your door.'
  },
  {
    icon: DollarSign,
    title: 'Competitive Pricing',
    description: 'Save 40-70% compared to new OEM parts. Transparent quotes with no hidden fees – straightforward pricing from trusted US-based suppliers.'
  },
  {
    icon: BadgeCheck,
    title: 'Quality Guaranteed',
    description: 'All parts undergo certified inspections before shipping. Every part comes with a 90-day warranty for your peace of mind.'
  },
  {
    icon: Wrench,
    title: 'Dealer & DIY Friendly',
    description: 'Whether you are a professional mechanic or a DIY enthusiast, our platform provides the same premium access, expert support, and seamless ordering experience.'
  }
]

export function FeaturesGridSection() {
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-background via-slate-900/20 to-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-20">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-4">Why Choose AUAPW</span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            Premium Features Built for You
          </h2>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-foreground/80">
            Access America&apos;s largest auto parts network with verified suppliers, transparent pricing, and guaranteed quality
          </p>
        </div>

        {/* 8-Card Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-24">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="group bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600 rounded-xl p-6 sm:p-8 transition-all duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.6)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.5),0_8px_20px_rgba(0,0,0,0.8)] hover:border-slate-500"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mb-4 group-hover:from-slate-600 group-hover:to-slate-700 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.3)]">
                  <Icon className="w-6 h-6 text-foreground/80 group-hover:text-foreground transition-colors" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent mb-16 sm:mb-24" />

        {/* 3-Column Trust Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">Network Scale</h3>
            <p className="text-2xl sm:text-3xl font-black text-white mb-3">2,000+</p>
            <p className="text-foreground/70 leading-relaxed">
              Verified junkyards and salvage yards across all 50 states, ensuring you find the right part – whether common or rare.
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">Your Savings</h3>
            <p className="text-2xl sm:text-3xl font-black text-white mb-3">40-70%</p>
            <p className="text-foreground/70 leading-relaxed">
              Save up to 70% compared to new OEM parts. Transparent quotes with no hidden fees – straightforward pricing you can trust.
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">Warranty Coverage</h3>
            <p className="text-2xl sm:text-3xl font-black text-white mb-3">90 Days</p>
            <p className="text-foreground/70 leading-relaxed">
              Every part is certified and comes with a warranty. From common components to rare discontinued items, all covered.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
