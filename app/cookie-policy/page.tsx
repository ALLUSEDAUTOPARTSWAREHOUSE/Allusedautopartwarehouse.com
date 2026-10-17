import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

import { BrandLogosSection } from "@/components/brand-logos"

export const metadata = {
  title: "Cookie Policy | AUAPW LLC",
  description: "AUAPW LLC cookie policy and information about how we use cookies.",
}

export default function CookiePolicyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[58px]">
        <div className="relative border-b border-border/20 bg-cover bg-center py-20" style={{ backgroundImage: "linear-gradient(to bottom right, rgba(13,15,22,0.78), rgba(13,15,22,0.78), rgba(13,15,22,0.88)), url('/images/heroes/hero-warehouse.png')" }}>
          <div className="mx-auto max-w-[900px] px-6">
            <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-primary">Legal</span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">Cookie Policy</h1>
          </div>
        </div>
        <div className="mx-auto max-w-[900px] px-6 py-20">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">Last updated: March 2026</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">What Are Cookies?</h2>
            <p className="mb-4">Cookies are small text files stored on your device when you visit our website. They help us remember your preferences, improve your browsing experience, and analyze how our site is used.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Essential Cookies</h3>
            <p className="mb-4">These cookies are necessary for the website to function properly. They enable you to navigate our site and use its features, such as user authentication and cart functionality.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Performance Cookies</h3>
            <p className="mb-4">These cookies collect information about how you use our website, such as which pages you visit and how long you spend on them. This helps us understand user behavior and improve our site.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Functional Cookies</h3>
            <p className="mb-4">These cookies remember your preferences, such as language selection, theme preference, and search history, to provide a personalized experience.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Advertising Cookies</h3>
            <p className="mb-4">These cookies may be used to deliver advertisements relevant to you and your interests. They track your browsing activity across websites.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">How to Control Cookies</h2>
            <p className="mb-4">You can control cookie settings in your browser. Most browsers allow you to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>View cookies stored on your device</li>
              <li>Accept or reject cookies</li>
              <li>Delete cookies from your device</li>
              <li>Set preferences for specific websites</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">Third-Party Cookies</h2>
            <p className="mb-4">Our website may contain links to third-party websites that may set their own cookies. We are not responsible for third-party cookie practices. Please review their privacy policies.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Changes to This Policy</h2>
            <p className="mb-4">We may update this Cookie Policy from time to time. Changes will be effective when posted on our website. Your continued use of our site constitutes acceptance of the updated policy.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
            <p className="mb-4">If you have questions about our Cookie Policy, please contact us at auapworld@gmail.com or 1-888-887-4199.</p>
          </div>
        </div>
        <BrandLogosSection />
      </main>
      <Footer />
    </>
  )
}
