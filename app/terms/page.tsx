import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BrandLogosSection } from "@/components/brand-logos"

export const metadata = {
  title: "Terms and Conditions | All Used Auto Parts Warehouse",
  description:
    "Terms and conditions of sale for All Used Auto Parts Warehouse (AUAPW LLC): parts warranty, returns, restocking fee, shipping, and buyer responsibilities.",
}

const sections = [
  {
    title: "1. Agreement to Terms",
    body: [
      "By accessing or using the All Used Auto Parts Warehouse (\"AUAPW\", \"we\", \"us\") website, or by placing an order with AUAPW LLC, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use this website or place an order.",
      "These terms apply to every sale, whether placed online, by phone, or by invoice, and form part of your order confirmation and invoice.",
    ],
  },
  {
    title: "2. Payment Authorization",
    body: [
      "By placing an order you authorize AUAPW LLC to charge the card or payment method you provide for the total amount shown on your order or invoice, once fitment and availability are confirmed by a parts specialist.",
      "Transaction fees are non-refundable. We do not cover return shipping or initial shipping charges except where a part was received damaged or shipped incorrectly.",
    ],
  },
  {
    title: "3. Shipping and Delivery",
    body: [
      "The standard shipping time frame is 7–14 business days. We process your order after receipt of full payment, and items leave our facilities once the part has been inspected. Tracking information is emailed 24–48 hours after your item ships; please provide a valid email address.",
      "Inspect your shipment thoroughly before accepting and signing for it. If a part arrives damaged, accept the delivery and contact customer service immediately; photo proof of damage may be requested.",
      "For an additional charge, we can ship to a commercial address without a loading dock or to a residential address using a lift-gate truck. Products are unloaded at the curb only; we cannot unload onto a driveway or into a garage.",
      "Shipments refused by the customer, or undeliverable after repeated failed delivery attempts, are returned to AUAPW and credited for the sale amount excluding shipping and handling. Please allow up to 14 business days for a credit to be issued.",
    ],
  },
  {
    title: "4. Limited Parts Warranty",
    body: [
      "Parts carry the limited parts warranty stated on your invoice. No labor warranty is provided unless purchased separately. All parts purchased from AUAPW must be installed within 10 business days of delivery, or the warranty is voided.",
      "Any defective or incorrect part must be returned to AUAPW within 10 business days of delivery, or the warranty is voided. The warranty is voided if the part is not returned in the same condition in which it was sent.",
      "This warranty applies only to the original purchaser, for private, non-commercial use, in the vehicle in which the part was originally installed, and is not transferable.",
    ],
  },
  {
    title: "5. Engine Warranty",
    body: [
      "Engine warranties are limited to manufacturing defects in the block, cylinder heads, pistons, crankshafts, camshafts, rockers, and oil pumps, plus internal lubricated parts, valves and lifters, and internal chain-driven water pumps.",
      "We do not warranty attached accessory parts, even when included with the engine, such as switches, sensors, cables, electronics, belts, hoses, water pumps, manifolds, alternators, A/C compressors, starters, wire harnesses, throttle bodies, injectors, ignition coils, spark plugs, turbochargers, or superchargers.",
      "Timing belts, thermostats, spark plugs, fluids, and seals are routine-maintenance items that must be replaced at installation and are not covered. Claims related to overheating or improper lubrication are not covered. Engine oil and filter must be replaced and documented every 4,000 miles with OEM-recommended oil.",
    ],
  },
  {
    title: "6. Transmission Warranty",
    body: [
      "Transmission warranties are limited to the transmission case, pan, tailshaft and housing (RWD), valve body (unless the vehicle manufacturer requires replacement), torque converter (automatic), and all internal lubricated parts.",
      "To validate the warranty, new gaskets, seals, filter, fluids, sensors and switches must be installed with the replacement transmission, the transmission cooler (if equipped) must be flushed, and transmission fluid and filter must be replaced at installation with OEM-recommended fluid. Documentation is required.",
      "Optional accessories attached for convenience — flywheel mounts, brackets, sensors and switches — are not covered.",
    ],
  },
  {
    title: "7. Warranty Claims Process",
    body: [
      "The vehicle must be taken to a licensed repair facility and diagnosed before filing a warranty claim, and must remain there until the claim is resolved. Contact us at support@allusedautopartswarehouse.com before your warranty period expires, including your order number and details of the issue.",
      "All repairs or replacements must be approved by AUAPW before any work is performed. We may request photos of the part and your VIN, may replace the part with a functionally equivalent part, may ask you to return the part for repair, or may refund the cost of the part. We reserve the right to inspect any item prior to refund or replacement.",
      "Proof of maintenance and an itemized installer invoice are required for all warranty claims. Our liability for all causes is limited to the price paid for the part.",
    ],
  },
  {
    title: "8. Warranty Exclusions",
    body: [
      "All warranties are null and void if: the vehicle is converted from private passenger use to commercial or fleet use, or used for racing, competition, or off-road recreation; failure is caused by abuse, misuse, modification, collision, fire, theft, vandalism, flood, or other external events; the part is installed or operated outside the United States; the installed heat tab center is melted or removed; the part was sold \"as is\"; or the vehicle is not serviced at proper intervals with manufacturer-specified fluids.",
      "We are not responsible for injury or damage sustained during or as a result of installation of our parts. This warranty does not cover freight costs or similar charges.",
    ],
  },
  {
    title: "9. Returns, Refunds & Restocking Fee",
    body: [
      "Our return policy provides 30 days from delivery to return a part for a refund. The original sales receipt or invoice must accompany all returns; returns without it will not be accepted. Refunds are issued once the returned part has been received, inspected, and processed. Original shipping charges are deducted from the refund except for parts received damaged or shipped incorrectly.",
      "Once an order has been placed and processed, cancellation is subject to a twenty-five percent (25%) handling and restocking fee. Orders cancelled after shipping are subject to the 25% fee plus all shipping charges.",
      "It is the customer's responsibility to accurately describe the vehicle (year, make, model, trim, part codes, or VIN). Incorrectly ordered parts accepted as a return are subject to the 25% restocking fee. Parts purchased from an outside source on the customer's behalf are not returnable under any circumstances.",
    ],
  },
  {
    title: "10. Fitment & Buyer Responsibility",
    body: [
      "The year, make, and model printed on your order or invoice is within a range of interchangeability and may not be the exact year and model of your vehicle or part. It is the buyer's responsibility to research and determine whether an item will fit their vehicle or application.",
      "AUAPW is not responsible for labor costs incurred for installation, nor for parts applied to the wrong make, model, or year when we did not specifically state the part is the correct match. Refer to the vehicle manufacturer's owner's manual for correct operation and maintenance schedules.",
    ],
  },
  {
    title: "11. Website Use, Accuracy & Liability",
    body: [
      "Website materials are provided on an \"as is\" basis. AUAPW disclaims all implied warranties of merchantability and fitness for a particular purpose to the fullest extent permitted by law, and does not warrant that website content is accurate, complete, or current. We may change website content at any time without notice.",
      "In no event shall AUAPW or its suppliers be liable for incidental or consequential damages arising from use of the website or products. Some states do not allow such limitations, so they may not apply to you; this warranty gives you specific legal rights, and you may have other rights that vary by state.",
      "We have not reviewed all sites linked from our website and are not responsible for their content; following any link is at your own risk.",
    ],
  },
  {
    title: "12. Modifications & Governing Law",
    body: [
      "AUAPW may revise these Terms and Conditions at any time without notice. By using this website or placing an order, you agree to be bound by the then-current version.",
      "These terms are governed by and construed in accordance with the laws of the United States and the State of California, and you submit to the exclusive jurisdiction of those courts.",
    ],
  },
  {
    title: "13. Contact Information",
    body: [
      "Questions about these Terms and Conditions, warranty claims, or returns: email support@allusedautopartswarehouse.com or call 1-888-887-4199, Monday through Friday, 8:00 a.m. to 5:00 p.m. Eastern Time.",
    ],
  },
]

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[58px]">
        <div
          className="relative border-b border-border/20 bg-cover bg-center py-20"
          style={{ backgroundImage: "linear-gradient(to bottom right, rgba(13,15,22,0.78), rgba(13,15,22,0.78), rgba(13,15,22,0.88)), url('/images/heroes/hero-warehouse.png')" }}
        >
          <div className="mx-auto max-w-[900px] px-6">
            <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-primary">Legal</span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              Terms and Conditions
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-300">
              The complete terms of sale for All Used Auto Parts Warehouse — the same conditions that appear on our
              invoices, applying to every online, phone, and invoice order.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-[900px] px-6 py-16">
          <p className="text-muted-foreground mb-10 text-sm">Last updated: October 2026</p>
          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-bold mb-3">{section.title}</h2>
                <div className="space-y-3">
                  {section.body.map((paragraph, i) => (
                    <p key={i} className="text-sm leading-relaxed text-foreground/70">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
        <BrandLogosSection />
      </main>
      <Footer />
    </>
  )
}
