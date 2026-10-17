import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BrandLogosSection } from "@/components/brand-logos"

import { QuoteForm } from "@/components/quote-form"
import { PageHero } from "@/components/page-hero"
import Image from "next/image"
import { Phone, MapPin, Clock } from "lucide-react"

export const metadata = {
  title: "Contact Us - AUAPW LLC",
  description: "Get in touch with AUAPW LLC. Call 1-888-887-4199 or fill out our contact form. We respond within 24 hours.",
}

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[58px]">
        {/* Header */}
        <PageHero
          image="support"
          align="left"
          eyebrow="Get in Touch"
          title="Contact Us"
          subtitle="Have a question or need a part? Reach out by phone, email, or use the form below. Our team responds within 24 hours."
        />

        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
            {/* Contact Info - shown after form on mobile */}
            <div className="flex flex-col gap-3 sm:gap-4 order-2 lg:order-1">
              {[
                { icon: Phone, title: "1-888-887-4199", sub: "Mon-Sat 8am-6pm PST", href: "tel:+18888874199" },
                { image: "/images/icon-email-logo.png", title: "auapworld@gmail.com", sub: "Response within 24 hours", href: "mailto:auapworld@gmail.com" },
                { icon: MapPin, title: "508 S Elm St, Ste 104, Denton, TX 76201", sub: "United States", href: "https://maps.google.com/?q=508+S+Elm+St+Ste+104+Denton+TX+76201" },
                { icon: Clock, title: "Business Hours", sub: "Monday-Saturday 8:00am - 6:00pm PST", href: "#" },
              ].map(({ icon: Icon, image, title, sub, href }) => (
                <a key={title} href={href} className="glass-card rounded-sm p-5 flex items-start gap-4 hover:-translate-y-0.5 transition-all">
                  <div className="w-10 h-10 rounded-full bg-secondary/50 border border-border/40 flex items-center justify-center shrink-0">
                    {image ? (
                      <img src={image} alt="" className="w-6 h-6" />
                    ) : Icon ? (
                      <Icon className="w-4 h-4 text-primary" />
                    ) : null}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                  </div>
                </a>
              ))}

              <div className="glass-card rounded-sm p-6 mt-2">
                <div className="metal-line mb-5" />
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5">Prefer to Call?</p>
                <a href="tel:+18888874199" className="text-2xl font-bold text-foreground block mb-1">1-888-887-4199</a>
                <p className="text-[11px] text-muted-foreground">Mon-Sat 8am-6pm PST</p>
              </div>
            </div>

            {/* Quote Form - shown first on mobile */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <QuoteForm />
            </div>
          </div>
        </div>

        <BrandLogosSection />
      </main>
      <Footer />
    </>
  )
}
