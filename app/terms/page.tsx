import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

import { BrandLogosSection } from "@/components/brand-logos"

export const metadata = {
  title: "Terms and Conditions | AUAPW LLC",
  description: "Terms and conditions for using AUAPW LLC services.",
}

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[58px]">
        <div className="relative border-b border-border/20 bg-cover bg-center py-20" style={{ backgroundImage: "linear-gradient(to bottom right, rgba(13,15,22,0.78), rgba(13,15,22,0.78), rgba(13,15,22,0.88)), url('/images/heroes/hero-warehouse.png')" }}>
          <div className="mx-auto max-w-[900px] px-6">
            <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-primary">Legal</span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">Terms and Conditions</h1>
          </div>
        </div>
        <div className="mx-auto max-w-[900px] px-6 py-20">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">Last updated: March 2026</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">1. Agreement to Terms</h2>
            <p className="mb-4">By accessing and using AUAPW LLC website, you agree to be bound by these Terms and Conditions. If you do not agree to abide by the above, please do not use this service.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">2. Use License</h2>
            <p className="mb-4">Permission is granted to temporarily download one copy of the materials (information or software) on AUAPW's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on AUAPW's website</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              <li>Attempt to gain unauthorized access to any portion of the website</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">3. Disclaimer of Warranties</h2>
            <p className="mb-4">The materials on AUAPW's website are provided on an 'as is' basis. AUAPW makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">4. Limitations of Liability</h2>
            <p className="mb-4">In no event shall AUAPW or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on AUAPW's website.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">5. Accuracy of Materials</h2>
            <p className="mb-4">The materials appearing on AUAPW's website could include technical, typographical, or photographic errors. AUAPW does not warrant that any of the materials on its website are accurate, complete, or current. AUAPW may make changes to the materials contained on its website at any time without notice.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">6. Links</h2>
            <p className="mb-4">AUAPW has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by AUAPW of the site. Use of any such linked website is at the user's own risk.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">7. Modifications</h2>
            <p className="mb-4">AUAPW may revise these terms and conditions for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms and conditions.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">8. Governing Law</h2>
            <p className="mb-4">These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">9. Contact Information</h2>
            <p className="mb-4">If you have any questions about these Terms and Conditions, please contact us at auapworld@gmail.com or call 1-888-887-4199.</p>
          </div>
        </div>
        <BrandLogosSection />
      </main>
      <Footer />
    </>
  )
}
