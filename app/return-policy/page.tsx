import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

import { BrandLogosSection } from "@/components/brand-logos"

export const metadata = {
  title: "Return Policy | AUAPW LLC",
  description: "AUAPW LLC return and refund policy for used auto parts purchases.",
}

export default function ReturnPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[58px]">
        <div className="relative border-b border-border/20 bg-cover bg-center py-20" style={{ backgroundImage: "linear-gradient(to bottom right, rgba(13,15,22,0.78), rgba(13,15,22,0.78), rgba(13,15,22,0.88)), url('/images/heroes/hero-warehouse.png')" }}>
          <div className="mx-auto max-w-[900px] px-6">
            <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-primary">Legal</span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">Return Policy</h1>
          </div>
        </div>
        <div className="mx-auto max-w-[900px] px-6 py-20">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold mt-8 mb-4">30-Day Return Guarantee</h2>
            <p className="mb-4">If you are not completely satisfied with your purchase, we offer a 30-day return window from the date of delivery. All returns must be initiated within this timeframe.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Return Requirements</h2>
            <p className="mb-4">To qualify for a return, the part must:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Be unused and uninstalled in its original condition</li>
              <li>Be returned with all original packaging and documentation</li>
              <li>Have proof of purchase (invoice or order number)</li>
              <li>Pass inspection upon receipt at our warehouse</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">90-Day Warranty</h2>
            <p className="mb-4">All used parts come with a 90-day warranty covering defects in workmanship and materials. If a part fails due to manufacturing defects within 90 days, we will replace it free of charge.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Return Process</h2>
            <ol className="list-decimal pl-6 mb-4 space-y-2">
              <li>Contact our team to initiate a return RMA (Return Merchandise Authorization) number</li>
              <li>Ship the part back to us with tracking (prepaid label provided for valid returns)</li>
              <li>Part is inspected upon receipt at our warehouse</li>
              <li>Refund is issued within 5-7 business days of approval</li>
            </ol>

            <h2 className="text-2xl font-bold mt-8 mb-4">Non-Returnable Items</h2>
            <p className="mb-4">The following items cannot be returned:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Installed or used parts</li>
              <li>Damaged parts due to customer negligence</li>
              <li>Items purchased as-is or final sale</li>
              <li>Parts without original packaging or documentation</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">Refunds</h2>
            <p className="mb-4">Approved returns will receive a full refund of the purchase price. Original shipping costs are non-refundable. Return shipping is free for defective or incorrect parts; customer pays for returns outside the warranty period.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Defective Part Replacement</h2>
            <p className="mb-4">If you receive a defective part, we will replace it free of charge or provide a full refund. Contact us immediately with photos and documentation of the defect.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Contact for Returns</h2>
            <p className="mb-4">Email: auapworld@gmail.com | Phone: 1-888-887-4199</p>
          </div>
        </div>
        <BrandLogosSection />
      </main>
      <Footer />
    </>
  )
}
