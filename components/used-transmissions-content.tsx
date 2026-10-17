"use client"

import Image from "next/image"
import { QuoteForm } from "@/components/quote-form"
import { Truck, Shield, RotateCcw, Cog } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PHONE_DISPLAY } from "@/lib/data"

export function UsedTransmissionsContent() {
  return (
    <section className="py-16 bg-background">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Content */}
          <div className="lg:col-span-2">
            <p className="text-[11px] text-muted-foreground mb-6">
              <a href="/" className="hover:text-foreground">Home</a> / Used Transmissions
            </p>

            <h1 className="font-serif text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-foreground mb-6">
              Used Transmissions
            </h1>

            <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-8">
              <Image src="/images/used-transmissions.jpg" alt="Used transmissions for sale" fill className="object-cover" />
            </div>

            <div className="text-muted-foreground text-[0.95rem] leading-[1.8] flex flex-col gap-4 mb-12">
              <p>
                Welcome to <strong className="text-foreground">AUAPW LLC</strong>. You are here because you are looking for a used transmission for your car. There are lots of auto part dealers selling quality used transmissions online. Prices may vary from dealer to dealer. Some dealers will offer a transmission for $1750 where the same transmission is available for $950. Reaching all the auto parts dealers is not easy, but we have solutions for you to find quality, cheap used transmissions in just one click.
              </p>
              <p>
                AUAPW LLC is connected with all junkyards and salvage yards near you, and can compare the best offers among them. When you fill the part request form, our system will send requests to all the auto part dealers and receive the part availability with price. The quality transmission and lowest price quote will be sent to you. Also, we will assist you to place an order to your home or garage.
              </p>
            </div>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Used Transmissions For Sale</h2>
            <div className="text-muted-foreground text-[0.95rem] leading-[1.8] flex flex-col gap-4 mb-12">
              <p>
                Are you looking for an affordable and high-quality car transmission? Transmission is the second most important part of your vehicle after the engine -- and it can be a real struggle when it stops working properly. Buying a new one can cost you a lot of money but fortunately, we have the perfect alternative -- used transmissions from the most trusted dealers in the country.
              </p>
              <p>
                At AUAPW LLC, we offer you a custom-designed used auto part locator that finds the best options from thousands of junkyards. Here, we guarantee our customers that they will get only high-performance transmissions at the most competitive prices.
              </p>
              <p>
                Whether you need a standard or automatic transmission, you can find the best deals here. With our simple-to-use search tool, it will take a few minutes to find the most affordable and cutting-edge used transmission for any vehicle -- BMW, Honda, Chevy and more.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {[
                { icon: Truck, title: "$240 Shipping Per Part", desc: "Flat-rate shipping across the USA. Each transmission ships for $240, with the charge shown before checkout." },
                { icon: Shield, title: "Warranty From Dealers", desc: "Every used transmission is covered by a 90-day warranty." },
                { icon: Cog, title: "All Types", desc: "Find automatic, manual, and CVT transmissions for all types of vehicles." },
                { icon: RotateCcw, title: "Returns Available", desc: "Not satisfied? Easily return the part. Contact us through our toll-free number." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass-card rounded-sm p-5">
                  <Icon className="w-5 h-5 text-primary mb-2" />
                  <h4 className="text-sm font-bold text-foreground mb-1">{title}</h4>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* 10 Things guide */}
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">10 Things to Watch for When Buying a Used Transmission</h2>
            <div className="flex flex-col gap-4 mb-12">
              {[
                { title: "1. Condition", desc: "The foremost step is knowing about the existing condition. If you don't know much about used auto parts, bring a mechanic along while purchasing." },
                { title: "2. Transmission Fluid Quality", desc: "Check the color -- usually red. If it has changed to brown, it needs replacement. If blackish, stay away from that transmission." },
                { title: "3. Check for Fluid Leakage", desc: "Pour some transmission fluid inside and observe the body for any signs of liquid coming out." },
                { title: "4. Listen for Unusual Noise", desc: "If the transmission makes grinding, popping or squealing noises when you go through the gears, consider switching to another." },
                { title: "5. Warranty", desc: "Reputable shops offer warranty. Typically most dealers offer a 12 month or 12,000 mile warranty." },
                { title: "6. Check Engagement", desc: "Start in Park mode -- it should idle without unnecessary noise. Shift to Drive -- the lever should shift smoothly." },
                { title: "7. Have It Tested", desc: "Make sure the specific part is tested for quality before completing the transaction." },
                { title: "8. Get Maintenance Records", desc: "Ensure the transmission was serviced every 20,000 to 50,000 miles per the manual." },
                { title: "9. Check Fluid Level", desc: "Ensure the transmission fluid is filled with manufacturer-approved level and quality oil." },
                { title: "10. Check References", desc: "Any reputable seller should provide references of past customers." },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-secondary/30 border border-border/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-foreground mb-1">{title}</h4>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="mb-12">
              <AccordionItem value="q1" className="border-border/40">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-primary">Is it better to buy a used or rebuilt transmission?</AccordionTrigger>
                <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed">
                  The first concern is price. Although used transmissions are less expensive, they may not last as long as rebuilt transmissions. Although rebuilding is more expensive, it may provide a longer-lasting solution. If you are mechanically inclined, you might be able to rebuild it yourself for better results.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2" className="border-border/40">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-primary">How can I get a cheap transmission?</AccordionTrigger>
                <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed">
                  Purchase from a salvage yard or individual. Find a rebuilder who may save you money by repairing your existing transmission. Negotiate a reduced price with your mechanic or dealership. Always conduct thorough research and obtain multiple quotes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3" className="border-border/40">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-primary">How can you get a warranty on a used transmission?</AccordionTrigger>
                <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed">
                  Many salvage yards and individual merchants offer warranties on their used parts. You can also look for a used transmission that still has the manufacturer warranty. Third-party warranty companies are also an option. Always examine the terms and conditions carefully.
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <p className="text-muted-foreground text-sm leading-relaxed">
              Got any more questions? Get in touch with us through our toll-free number <a href="tel:+18888874199" className="text-primary font-bold">{PHONE_DISPLAY}</a>
            </p>
          </div>

          {/* Right: Sticky Quote Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-[74px]">
              <QuoteForm defaultPart="Transmission" compact />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
