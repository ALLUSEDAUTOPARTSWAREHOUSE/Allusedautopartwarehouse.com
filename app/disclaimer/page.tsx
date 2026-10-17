import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

import { BrandLogosSection } from "@/components/brand-logos"

export const metadata = {
  title: "Disclaimer | AUAPW LLC",
  description: "AUAPW LLC disclaimer and legal notices regarding the use of our services.",
}

export default function DisclaimerPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[58px]">
        <div className="relative border-b border-border/20 bg-cover bg-center py-20" style={{ backgroundImage: "linear-gradient(to bottom right, rgba(13,15,22,0.78), rgba(13,15,22,0.78), rgba(13,15,22,0.88)), url('/images/heroes/hero-warehouse.png')" }}>
          <div className="mx-auto max-w-[900px] px-6">
            <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-primary">Legal</span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">Disclaimer</h1>
          </div>
        </div>
        <div className="mx-auto max-w-[900px] px-6 py-20">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">Last updated: March 2026</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">General Disclaimer</h2>
            <p className="mb-4">The information provided on the AUAPW website is for informational purposes only. While we strive to provide accurate and up-to-date information, AUAPW makes no representations or warranties of any kind, expressed or implied, about the completeness, accuracy, reliability, suitability, or availability of information contained on the website or related resources.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Part Condition and Fitment</h2>
            <p className="mb-4">Although all parts are inspected and tested, used auto parts are sold as-is. Condition descriptions are based on professional assessment but may vary based on individual perception. AUAPW is not responsible for fitment issues. We strongly recommend consulting with a qualified mechanic before installation.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">No Professional Advice</h2>
            <p className="mb-4">The information on our website does not constitute professional automotive advice. Always consult with a qualified mechanic or automotive professional for technical questions or concerns regarding vehicle maintenance and repair.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Limitation of Liability</h2>
            <p className="mb-4">In no event shall AUAPW, its owners, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our website or services, including but not limited to loss of profits, vehicle damage, or personal injury.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Third-Party Links</h2>
            <p className="mb-4">Our website may contain links to third-party websites. AUAPW is not responsible for the content, accuracy, or practices of third-party sites. Your use of third-party websites is at your own risk and subject to their terms and conditions.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Vehicle Safety and Compliance</h2>
            <p className="mb-4">It is your responsibility to ensure that any purchased parts comply with federal, state, and local regulations and are appropriate for your vehicle. AUAPW is not liable for non-compliance with applicable laws or regulations.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Installation Responsibility</h2>
            <p className="mb-4">Installation of automotive parts should only be performed by qualified technicians. AUAPW is not responsible for improper installation, damage caused by installation, or safety issues resulting from incorrect installation.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Warranty Limitations</h2>
            <p className="mb-4">All warranties are limited to the replacement or refund of the purchased part only. AUAPW does not cover labor, installation, removal, or any consequential damages resulting from part failure.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Contact for Questions</h2>
            <p className="mb-4">If you have questions about this disclaimer, please contact us at auapworld@gmail.com or 1-888-887-4199.</p>
          </div>
        </div>
        <BrandLogosSection />
      </main>
      <Footer />
    </>
  )
}
