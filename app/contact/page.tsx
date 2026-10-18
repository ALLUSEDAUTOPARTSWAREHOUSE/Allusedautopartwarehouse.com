import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BrandLogosSection } from "@/components/brand-logos"
import { ContactForm } from "@/components/contact-form"
import { PageHero } from "@/components/page-hero"
import { Clock, Mail, MapPin, Phone } from "lucide-react"

export const metadata = {
  title: "Contact Us - AUAPW LLC",
  description: "Get in touch with AUAPW LLC. Our parts specialists respond within one business day.",
}

const contactDetails = [
  { icon: Phone, title: "1-888-887-4199", sub: "Mon–Sat · 8am–6pm PST", href: "tel:+18888874199" },
  { icon: Mail, title: "auapworld@gmail.com", sub: "Response within one business day", href: "mailto:auapworld@gmail.com" },
  { icon: MapPin, title: "Denton, Texas", sub: "Serving customers nationwide", href: "https://maps.google.com/?q=508+S+Elm+St+Ste+104+Denton+TX+76201" },
  { icon: Clock, title: "Parts specialists", sub: "Here to help with your request", href: "#contact-form" },
]

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[58px]">
        <PageHero image="support" align="left" eyebrow="Get in Touch" title="Let&apos;s talk parts" subtitle="Questions about a part, an order, or finding the right fit? Send us a message and our team will get back to you within one business day." />
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
            <aside className="order-2 flex flex-col gap-3 lg:order-1">
              <div className="mb-2 lg:mb-3">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Direct contact</p>
                <h2 className="mt-2 text-xl font-bold text-foreground">We&apos;re here to help.</h2>
              </div>
              {contactDetails.map(({ icon: Icon, title, sub, href }) => (
                <a key={title} href={href} className="glass-card group flex items-start gap-4 rounded-xl p-4 transition-transform hover:-translate-y-0.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/50 bg-secondary/50"><Icon className="size-4 text-primary" aria-hidden="true" /></span>
                  <span><span className="block text-sm font-bold text-foreground">{title}</span><span className="mt-1 block text-xs text-muted-foreground">{sub}</span></span>
                </a>
              ))}
            </aside>
            <div id="contact-form" className="order-1 lg:col-span-2 lg:order-2"><ContactForm /></div>
          </div>
        </div>
        <BrandLogosSection />
      </main>
      <Footer />
    </>
  )
}
