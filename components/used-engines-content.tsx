"use client"

import Image from "next/image"
import { QuoteForm } from "@/components/quote-form"
import { Truck, Shield, RotateCcw, Cog } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PHONE_DISPLAY } from "@/lib/data"

export function UsedEnginesContent() {
  return (
    <section className="py-10 sm:py-16 bg-background">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          {/* Left: Content - shown after form on mobile */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {/* Breadcrumb */}
            <p className="text-[11px] text-muted-foreground mb-6">
              <a href="/" className="hover:text-foreground">Home</a> / Used Engines for Sale
            </p>

            <h1 className="font-serif text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-foreground mb-6">
              Used Engines
            </h1>

            {/* Hero image */}
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-8">
              <Image src="/images/used-engines.jpg" alt="Used engines for sale" fill className="object-cover" />
            </div>

            <div className="text-muted-foreground text-[0.95rem] leading-[1.8] flex flex-col gap-4 mb-12">
              <p>
                Welcome to <strong className="text-foreground">AUAPW LLC</strong>. You are here because you are looking for a used engine for your car. There are lots of auto part dealers selling quality used engines online. Prices may vary from dealer to dealer. Some dealers will offer an engine for $1500 where the same engine is available for $850. Reaching all the auto parts dealers is not easy, but we have solutions for you to find quality, cheap used engines in just one click.
              </p>
              <p>
                AUAPW LLC is connected with all junkyards and salvage yards near you, and can compare the best offers among them. When you fill the part request form, our system will send requests to all the auto part dealers and receive the part availability with price. The quality engine and lowest price quote will be sent to you. Also, we will assist you to place an order to your home or garage.
              </p>
              <p>
                We always ensure that shipping is a flat $240 per part, with warranty coverage. We ensure that we should have the return or replacement facility if there is any problem with your purchase. What are you waiting for? Fill the form or call us at our toll free number. We are happy to assist you now!
              </p>
            </div>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Used Engines For Sale</h2>
            <div className="text-muted-foreground text-[0.95rem] leading-[1.8] flex flex-col gap-4 mb-12">
              <p>
                The engine is the heart of your vehicle, thus the most important part of it. Proper maintenance is required to keep the engine working for a long period. Sometimes buying a good engine can cost you a lot of money. To help you out, we created this online locator of the best junkyards and salvage yards around the USA. Here, at AUAPW LLC, you can find a wide selection of top-quality engines that can fit any budget.
              </p>
              <p>
                So, instead of paying a fortune to buy a new engine from a salon you can save some time and money -- and purchase a used engine online. AUAPW LLC is one of the leading online used auto parts locators offering bespoke products with the most affordable prices in the industry.
              </p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {[
                { icon: Truck, title: "$240 Shipping Per Part", desc: "Flat-rate shipping across the USA. Each engine ships for $240, with the charge shown before checkout." },
                { icon: Shield, title: "Warranty From Dealers", desc: "Every used engine is covered by a 90-day warranty." },
                { icon: Cog, title: "All Engine Types", desc: "Find gasoline, diesel and hybrid engines with low mileage for all types of vehicles -- van, sedan, jeep and more." },
                { icon: RotateCcw, title: "Returns Available", desc: "Not satisfied with the used auto part? You can easily return it. Contact us through our toll-free number." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass-card rounded-sm p-5">
                  <Icon className="w-5 h-5 text-primary mb-2" />
                  <h4 className="text-sm font-bold text-foreground mb-1">{title}</h4>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Guide section */}
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">The Ultimate Guide to Get Used Engines for Sale</h2>
            <div className="text-muted-foreground text-[0.95rem] leading-[1.8] flex flex-col gap-4 mb-8">
              <p>
                Of course, it will be a bad day when you find that your car needs an engine replacement. Now you are in a situation where you must decide whether the existing car engine is worth fixing. Else it would make sense to save your money by buying a used engine instead of spending on a new one.
              </p>
              <p>
                Whatever be the situation you are in, buying a used engine will be a great solution. However, it is also simultaneously important not to get a bad engine part.
              </p>
            </div>

            {/* Engine maintenance tips */}
            <h3 className="text-lg font-bold text-foreground mb-3">Tips to Prolong Engine Life</h3>
            <ul className="text-muted-foreground text-sm leading-[1.8] list-disc list-inside flex flex-col gap-2 mb-10 pl-2">
              <li>Always adhere to the maintenance plan specified by the engine or car manufacturer in the maintenance manual.</li>
              <li>When you notice even small issues from your engine, do not put them off. If you notice an unusual smell or some exhaust or fluid spillage, immediately get your engine into the service center.</li>
              <li>Ensure your engine is free from grime, dirt, sludge, and other contaminant particles.</li>
              <li>Abide by the speed limit to decrease the wear on your engine, thus prolonging its lifespan.</li>
            </ul>

            {/* FAQ */}
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="mb-12">
              <AccordionItem value="q1" className="border-border/40">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-primary">Are used engines good?</AccordionTrigger>
                <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed">
                  Used engines can be a great deal. Consider the source -- if you are buying from a reputable dealer, you are likely to get a quality product. Used engines are rigorously examined before being sold, so their reliability is often far greater than expected.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2" className="border-border/40">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-primary">Is a used engine worth buying?</AccordionTrigger>
                <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed">
                  Make sure the engine is compatible with your car. Check to see if the engine is in working order and that you are getting a reasonable price. Used engines are a great option for anyone looking to save money on car maintenance.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3" className="border-border/40">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-primary">Which is better -- rebuilt or used engine?</AccordionTrigger>
                <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed">
                  Although a used engine is less expensive, it may have greater wear and tear. The cost of a rebuilt engine is higher, but it will last longer. If you are looking to save money, a used engine is the best choice. If reliability is your primary priority, a rebuilt engine is a superior alternative.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4" className="border-border/40">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-primary">Is replacing an engine worth it?</AccordionTrigger>
                <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed">
                  Replacing your car engine is really worth your money and extends your vehicle life. Buying a used car engine is a wise investment. By choosing to buy a used engine, you avoid the production of a new engine, which is environmentally friendly. An engine replacement can also result in savings of taxes, license fees, and insurance costs.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5" className="border-border/40">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-primary">How many miles can an engine last?</AccordionTrigger>
                <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed">
                  {`According to AARP, the average mileage of a car engine is assumed to be between 12,000 and 15,000 miles per year. Keeping your car engine in good condition has a lot of benefits. Everything comes down to maintenance activities, your driving habits, and regular servicing.`}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <p className="text-muted-foreground text-sm leading-relaxed">
              Got any more questions? Get in touch with us through our toll-free number <a href="tel:+18888874199" className="text-primary font-bold">{PHONE_DISPLAY}</a>
            </p>
          </div>

          {/* Right: Sticky Quote Form - shown first on mobile */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-[74px]">
              <QuoteForm defaultPart="Engine" compact />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
