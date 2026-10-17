import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

import { BrandLogosSection } from "@/components/brand-logos"

export const metadata = {
  title: "Shipping Policy | AUAPW LLC",
  description: "AUAPW LLC shipping policy, rates, and delivery information for used auto parts.",
}

export default function ShippingPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[58px]">
        <div className="relative border-b border-border/20 bg-cover bg-center py-20" style={{ backgroundImage: "linear-gradient(to bottom right, rgba(13,15,22,0.78), rgba(13,15,22,0.78), rgba(13,15,22,0.88)), url('/images/heroes/hero-salvage.png')" }}>
          <div className="mx-auto max-w-[900px] px-6">
            <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-primary">Legal</span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">Shipping Policy</h1>
          </div>
        </div>
        <div className="mx-auto max-w-[900px] px-6 py-20">
          <div className="prose prose-invert max-w-none">
            <p className="text-lg mb-8 text-foreground/80"><strong>Our best in class shipping service delivers all across the US</strong></p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Delivery Timeframes</h2>
            <p className="mb-4">Usual delivery time is about <strong>7-14 working days</strong>, but due to some unusual situations, please allow additional time for delivery.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Shipping Methods</h2>
            <p className="mb-4">We ship daily via multiple carriers including UPS, FedEx, Roadway Express, and other logistics partners. The carrier selection depends on:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Part size and weight</li>
              <li>Your delivery location</li>
              <li>Economic feasibility of shipping</li>
            </ul>
            <p className="mb-4 text-foreground/70">Depending on the part needed and your location, it may not be economically feasible to ship some parts. Contact us for special shipping requests.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Tracking</h2>
            <p className="mb-4">All shipments include tracking numbers sent via email. You can track your order status in real-time through the carrier's website.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Packaging</h2>
            <p className="mb-4">All parts are professionally packaged with protective materials to ensure safe delivery during transit. We take great care to prevent damage and ensure your parts arrive in excellent condition.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Shipping Costs</h2>
            <p className="mb-4"><strong>A flat $240 shipping charge applies to every part.</strong> The charge is displayed on product actions, in your cart, and at checkout before you complete your purchase.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Signature Requirements</h2>
            <p className="mb-4">High-value items (over $1,000) require signature upon delivery for proof of delivery and insurance purposes.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Liability</h2>
            <p className="mb-4">While we take every precaution to ensure safe delivery, AUAPW LLC is not liable for damage caused by carrier negligence. We recommend purchasing additional shipping insurance for high-value items.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">International Shipping</h2>
            <p className="mb-4">At this time, we only ship to addresses within the United States. For international inquiries, please contact our team.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
            <p className="mb-4">For shipping inquiries, contact us at:</p>
            <ul className="list-none pl-0 space-y-2">
              <li>📞 Phone: <a href="tel:+18888874199" className="text-blue-400 hover:text-blue-300">1-888-887-4199</a></li>
              <li>📧 Email: <a href="mailto:support@allusedautopartswarehouse.com" className="text-blue-400 hover:text-blue-300">support@allusedautopartswarehouse.com</a></li>
            </ul>
          </div>
        </div>
        <BrandLogosSection />
      </main>
      <Footer />
    </>
  )
}
