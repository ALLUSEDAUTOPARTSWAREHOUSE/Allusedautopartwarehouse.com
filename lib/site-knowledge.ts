// Website knowledge base — indexes AUAPW site content so the AI assistant
// can answer general customer questions (policies, company info, navigation)
// in addition to live catalog lookups.

export interface KnowledgeEntry {
  id: string
  title: string
  url: string
  keywords: string[]
  content: string
}

export const SITE_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "company",
    title: "About AUAPW LLC",
    url: "/about",
    keywords: ["about", "company", "who", "auapw", "trust", "salvage", "yards", "nationwide"],
    content:
      "AUAPW LLC is a trusted used auto parts marketplace sourcing quality engines, transmissions, body parts and more from 2,000+ verified salvage yards nationwide. We focus on quality-tested parts, fair pricing, and reliable nationwide shipping.",
  },
  {
    id: "contact",
    title: "Contact & Support",
    url: "/contact",
    keywords: ["contact", "phone", "call", "email", "support", "help", "hours", "reach", "talk", "human", "agent"],
    content:
      "Phone: 1-888-887-4199 (Mon-Sat 8:00am-6:00pm PST). Email: auapworld@gmail.com (we respond within 24 hours). You can also use the contact form on the Contact page. Our team is happy to help with fitment, orders, and quotes.",
  },
  {
    id: "shipping",
    title: "Shipping Policy",
    url: "/shipping-policy",
    keywords: ["shipping", "delivery", "ship", "how long", "arrive", "freight", "cost", "rate", "tracking"],
    content:
      "Shipping is a flat rate of $240 per part and we deliver across the United States. Typical delivery time is about 3-7 business days depending on location. Tracking information is provided once your order ships.",
  },
  {
    id: "warranty",
    title: "Warranty",
    url: "/return-policy",
    keywords: ["warranty", "guarantee", "coverage", "defect", "protected", "guaranteed"],
    content:
      "Used and rebuilt parts include a 90-day warranty. If a part arrives defective or is not as described, contact support to arrange a replacement or refund.",
  },
  {
    id: "returns",
    title: "Returns & Refunds",
    url: "/return-policy",
    keywords: ["return", "refund", "money back", "exchange", "cancel", "wrong part", "rma"],
    content:
      "We accept returns for parts that are defective, damaged in transit, or not as described. Contact support with your order number to start a return. Refunds are issued once the returned part is received and inspected.",
  },
  {
    id: "warranty-registration",
    title: "Warranty Registration",
    url: "/customer/dashboard",
    keywords: ["register", "registration", "activate warranty", "warranty register"],
    content:
      "You can register your part's warranty from your customer dashboard after purchase. Keep your order number handy to link the warranty to your purchase.",
  },
  {
    id: "how-to-order",
    title: "How to Order",
    url: "/brands",
    keywords: ["order", "buy", "purchase", "checkout", "how do i", "cart", "guest"],
    content:
      "Search the catalog or use VIN/vehicle search to find your part, add it to the cart, and check out. Guest checkout is available, or log in for order tracking and saved vehicles. You can also request a quote if you can't find a part.",
  },
  {
    id: "quote",
    title: "Request a Quote",
    url: "/quote",
    keywords: ["quote", "price check", "cant find", "can not find", "custom", "request"],
    content:
      "If a part isn't listed, request a free quote on the Quote page. Provide your vehicle year, make, model, and the part you need, and our team will source it from our salvage yard network.",
  },
  {
    id: "vin-search",
    title: "VIN & Vehicle Search",
    url: "/ai-search",
    keywords: ["vin", "vehicle search", "fitment", "compatible", "compatibility", "fit my car", "year make model"],
    content:
      "Use VIN search or year/make/model vehicle search to find parts guaranteed to fit your vehicle. Enter your VIN for the most accurate fitment results.",
  },
  {
    id: "categories",
    title: "Parts Categories",
    url: "/brands",
    keywords: ["category", "categories", "engine", "transmission", "body", "brakes", "suspension", "electrical", "cooling", "exhaust", "drivetrain", "what do you sell"],
    content:
      "We carry used engines, transmissions, body parts, brakes, suspension, electrical, cooling, exhaust, and drivetrain parts. Browse by category from the catalog or the Parts menu.",
  },
  {
    id: "account",
    title: "Customer Account & Dashboard",
    url: "/customer/login",
    keywords: ["account", "login", "sign in", "dashboard", "order tracking", "track order", "wishlist", "saved vehicles", "my orders"],
    content:
      "Log in to your customer account to track orders, view order history, manage your wishlist, save vehicles, register warranties, and start return requests. New customers can sign up in seconds.",
  },
]

// Simple keyword/text search over the knowledge base.
export function searchSiteKnowledge(query: string, limit = 3): KnowledgeEntry[] {
  const q = query.toLowerCase()
  const tokens = q.split(/[^a-z0-9]+/).filter(Boolean)

  const scored = SITE_KNOWLEDGE.map((entry) => {
    let score = 0
    for (const kw of entry.keywords) {
      if (q.includes(kw)) score += 3
      for (const t of tokens) {
        if (kw.includes(t) || t.includes(kw)) score += 1
      }
    }
    const haystack = (entry.title + " " + entry.content).toLowerCase()
    for (const t of tokens) {
      if (haystack.includes(t)) score += 1
    }
    return { entry, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry)
}

// Short summary of site facts injected into the system prompt for quick answers.
export const SITE_SUMMARY = `AUAPW LLC — used auto parts marketplace (2,000+ verified salvage yards nationwide).
- Phone: 1-888-887-4199, Mon-Sat 8am-6pm PST. Email: auapworld@gmail.com (24h response).
- Shipping: flat $240 per part, US-wide, typically 3-7 business days with tracking.
- Warranty: 90 days on used and rebuilt parts.
- Returns accepted for defective/damaged/not-as-described parts.
- Guest checkout available; accounts support order tracking, wishlist, saved vehicles, warranty registration, and returns.
- Categories: engines, transmissions, body, brakes, suspension, electrical, cooling, exhaust, drivetrain.`
