import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

import { BrandLogosSection } from "@/components/brand-logos"

export const metadata = {
  title: "Acceptable Use Policy | AUAPW LLC",
  description: "AUAPW LLC Acceptable Use Policy regarding website and service usage.",
}

export default function AcceptableUsePolicyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[58px]">
        <div className="relative border-b border-border/20 bg-cover bg-center py-20" style={{ backgroundImage: "linear-gradient(to bottom right, rgba(13,15,22,0.78), rgba(13,15,22,0.78), rgba(13,15,22,0.88)), url('/images/heroes/hero-warehouse.png')" }}>
          <div className="mx-auto max-w-[900px] px-6">
            <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-primary">Legal</span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">Acceptable Use Policy</h1>
          </div>
        </div>
        <div className="mx-auto max-w-[900px] px-6 py-20">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">Last updated: March 2026</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Purpose</h2>
            <p className="mb-4">This Acceptable Use Policy outlines the terms and conditions for using the AUAPW website and services. By accessing our site, you agree to comply with these guidelines.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Prohibited Activities</h2>
            <p className="mb-4">Users are prohibited from:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Uploading, posting, or distributing illegal content</li>
              <li>Harassing, threatening, or abusing other users</li>
              <li>Attempting to gain unauthorized access to our systems</li>
              <li>Using automated tools to scrape or download content without permission</li>
              <li>Transmitting viruses, malware, or harmful code</li>
              <li>Violating intellectual property rights</li>
              <li>Making false claims or engaging in fraudulent activities</li>
              <li>Impersonating others or misrepresenting identity</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">Account Responsibility</h2>
            <p className="mb-4">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access or use of your account.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Content Guidelines</h2>
            <p className="mb-4">Any content you submit to our website must:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Be accurate and truthful</li>
              <li>Not violate any laws or regulations</li>
              <li>Not infringe on anyone's rights</li>
              <li>Not contain offensive, obscene, or discriminatory material</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">Enforcement</h2>
            <p className="mb-4">AUAPW reserves the right to investigate and enforce this policy. Violations may result in account suspension, termination, or legal action. We may cooperate with law enforcement authorities as needed.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Monitoring</h2>
            <p className="mb-4">We reserve the right to monitor website activity to ensure compliance with this policy and to protect our users and services.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Changes to Policy</h2>
            <p className="mb-4">We may update this Acceptable Use Policy at any time. Continued use of our website constitutes acceptance of any changes.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
            <p className="mb-4">To report violations or for questions about this policy, contact us at auapworld@gmail.com or 1-888-887-4199.</p>
          </div>
        </div>
        <BrandLogosSection />
      </main>
      <Footer />
    </>
  )
}
