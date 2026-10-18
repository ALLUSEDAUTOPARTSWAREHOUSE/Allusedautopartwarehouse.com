import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

import { BrandLogosSection } from "@/components/brand-logos"

export const metadata = {
  title: "Privacy Policy - AUAPW LLC",
  description: "Privacy policy for AUAPW LLC. Learn how we collect, use, and protect your personal information.",
}

const sections = [
  {
    title: "Information We Collect",
    content: [
      "When you use our services, we may collect the following types of information:",
      "Personal Information: Name, phone number, email address, ZIP code, and mailing address provided when you submit a quote request or contact form.",
      "Vehicle Information: Year, make, model, and part details submitted through our search and quote forms.",
      "Usage Information: Pages visited, time spent on our site, browser type, device information, and IP address collected automatically through standard web technologies.",
      "Communication Records: Records of phone calls, emails, and form submissions between you and our team.",
    ],
  },
  {
    title: "How We Use Your Information",
    content: [
      "We use the information we collect for the following purposes:",
      "To process your quote requests and connect you with verified auto part dealers in our network.",
      "To communicate with you regarding your parts inquiries, order status, and customer support.",
      "To improve our website, services, and the overall user experience.",
      "To send you relevant offers and information about auto parts, with your consent.",
      "To comply with legal obligations and protect our rights.",
    ],
  },
  {
    title: "Information Sharing",
    content: [
      "We may share your information with the following parties:",
      "Verified Dealers: When you submit a quote request, your vehicle and contact information is shared with relevant auto part dealers in our network so they can provide pricing and availability.",
      "Service Providers: We may share information with third-party service providers who assist us in operating our website, processing communications, and analyzing usage data.",
      "We do not sell your personal information to third parties for their own marketing purposes.",
    ],
  },
  {
    title: "Communication Consent",
    content: [
      "By submitting a form on our website, you authorize AUAPW LLC to contact you via text message and phone call at the number you provided, including through automated means, with offers and other information.",
      "Message and data rates may apply. Consent is not a condition of purchase.",
      "You may opt out of text messages at any time by replying STOP to any message received.",
    ],
  },
  {
    title: "Data Security",
    content: [
      "We implement reasonable security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.",
      "While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.",
    ],
  },
  {
    title: "Cookies and Tracking",
    content: [
      "Our website may use cookies and similar tracking technologies to enhance your browsing experience and collect usage data.",
      "You can control cookie settings through your browser. Disabling cookies may affect certain features of our website.",
    ],
  },
  {
    title: "Third-Party Links",
    content: [
      "Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites.",
      "We encourage you to review the privacy policies of any third-party sites you visit.",
    ],
  },
  {
    title: "Your Rights",
    content: [
      "Depending on your location, you may have certain rights regarding your personal information, including:",
      "The right to access the personal information we hold about you.",
      "The right to request correction of inaccurate information.",
      "The right to request deletion of your personal information.",
      "The right to opt out of marketing communications.",
      "To exercise any of these rights, please contact us using the information provided below.",
    ],
  },
  {
    title: "Children's Privacy",
    content: [
      "Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children.",
    ],
  },
  {
    title: "Changes to This Policy",
    content: [
      "We may update this privacy policy from time to time. Changes will be posted on this page with an updated effective date.",
      "We encourage you to review this policy periodically to stay informed about how we protect your information.",
    ],
  },
  {
    title: "Contact Us",
    content: [
      "If you have any questions or concerns about this privacy policy, please contact us:",
      "Phone: 1-888-887-4199",
      "Email: auapworld@gmail.com",
      "Address: 508 S Elm St, Ste 104, Denton, TX 76201, United States",
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[58px]">
        {/* Header */}
        <div className="relative border-b border-border/30 bg-cover bg-center" style={{ backgroundImage: "linear-gradient(to bottom right, rgba(13,15,22,0.78), rgba(13,15,22,0.78), rgba(13,15,22,0.88)), url('/images/heroes/hero-warehouse.png')" }}>
          <div className="metal-line" />
          <div className="mx-auto max-w-[1280px] px-6 py-20">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/50" />
              <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-primary">Legal</span>
            </div>
            <h1 className="font-serif text-[clamp(1.75rem,4vw,3.5rem)] font-bold text-foreground">Privacy Policy</h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-[520px]">
              AUAPW LLC is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/60">Effective Date: January 1, 2024</p>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-[900px] px-6 py-20">
          <div className="flex flex-col gap-10">
            {sections.map((section, i) => (
              <section key={section.title} className="glass-card rounded-sm p-7 sm:p-8">
                <div className="flex items-start gap-4 mb-5">
                  <span className="font-serif text-3xl font-semibold text-foreground/10 leading-none shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-serif text-lg font-bold text-foreground pt-1">{section.title}</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {section.content.map((paragraph, j) => (
                    <p key={j} className="text-sm text-muted-foreground leading-relaxed">
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
