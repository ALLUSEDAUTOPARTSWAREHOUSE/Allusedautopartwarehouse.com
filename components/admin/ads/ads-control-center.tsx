"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { Activity, ArrowUpRight, BarChart3, CheckCircle2, CircleAlert, Facebook, Globe2, Instagram, PackageCheck, RefreshCw, ShoppingBag, Sparkles } from "lucide-react"

type Destination = "google" | "openai" | "facebook" | "instagram" | "tiktok" | "pinterest"
const OBJECTIVE_LABELS: Record<string, string> = { product_sales: "Product sales", traffic: "Website traffic", leads: "Quote requests / leads", remarketing: "Remarketing", brand_awareness: "Brand awareness" }
const DESTINATIONS = [
  { id: "google", name: "Google Merchant Center", detail: "Shopping listings, price and availability", status: "Connection must be verified", icon: Globe2, href: "/admin/merchant" },
  { id: "openai", name: "ChatGPT Ads product feed", detail: "Product discovery and eligible ad placements", status: "Feed connection not verified", icon: Sparkles, href: "https://ads.openai.com/" },
  { id: "facebook", name: "Facebook catalog & ads", detail: "Meta catalog and campaign destinations", status: "Connect account to enable", icon: Facebook, href: "/admin/marketing/social" },
  { id: "instagram", name: "Instagram shopping & ads", detail: "Product discovery and social creative", status: "Connect account to enable", icon: Instagram, href: "/admin/marketing/social" },
  { id: "tiktok", name: "TikTok ads/catalog", detail: "Short-form creative and catalog ads", status: "Connect account to enable", icon: Activity, href: "/admin/marketing/social" },
  { id: "pinterest", name: "Pinterest product feed", detail: "Visual product discovery", status: "Connect account to enable", icon: PackageCheck, href: "/admin/marketing/social" },
]

function Pill({ children, good = false }: { children: ReactNode; good?: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${good ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
    {good ? <CheckCircle2 className="size-3.5" /> : <CircleAlert className="size-3.5" />}{children}
  </span>
}

export function AdsControlCenter() {
  const [selected, setSelected] = useState<Destination[]>(["google", "openai"])
  const [objective, setObjective] = useState("product_sales")
  const [campaignName, setCampaignName] = useState("AUAPW parts catalog campaign")
  const [budget, setBudget] = useState("")
  const [country, setCountry] = useState("India")
  const [showPlan, setShowPlan] = useState(false)
  const toggle = (id: Destination) => setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id])
  const selectedNames = useMemo(() => DESTINATIONS.filter(d => selected.includes(d.id)).map(d => d.name), [selected])

  return <div className="mx-auto flex max-w-7xl flex-col gap-7">
    <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div><p className="text-sm font-medium text-primary">AUAPW · Marketing operations</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Product feeds & Ads Center</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">One catalog workflow for Google Merchant, ChatGPT Ads and connected social channels. Choose destinations per upload, review feed health, then plan campaigns with clear readiness checks.</p></div>
      <Link href="/admin/products" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Upload or manage products <ArrowUpRight className="size-4" /></Link>
    </header>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[{label:"Catalog source",value:"AUAPW product catalog",note:"Website remains the source of truth",icon:ShoppingBag},{label:"Feed destinations",value:`${selected.length} selected`,note:"Selection applies to your planned workflow",icon:RefreshCw},{label:"Live sync status",value:"Not connected",note:"No sync telemetry available yet",icon:Activity},{label:"Campaign reporting",value:"Awaiting integrations",note:"Spend, clicks and conversions appear after connection",icon:BarChart3}].map(item => <div key={item.label} className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{item.label}</span><item.icon className="size-5 text-muted-foreground" /></div><p className="mt-3 text-lg font-semibold">{item.value}</p><p className="mt-1 text-xs text-muted-foreground">{item.note}</p></div>)}
    </section>

    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-semibold">1. Choose product sync destinations</h2><p className="mt-1 text-sm text-muted-foreground">Select more than one destination for the same AUAPW product upload.</p></div><Pill>Live connections unverified</Pill></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {DESTINATIONS.map(dest => { const Icon = dest.icon; const active = selected.includes(dest.id); return <label key={dest.id} className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${active ? "border-primary/40 bg-primary/5" : "hover:border-border/50"}`}><div className="flex items-center gap-3"><Icon className="size-5 text-primary" /><div><div className="text-sm font-semibold">{dest.name}</div><div className="text-xs text-muted-foreground">{dest.detail}</div></div></div><input type="checkbox" checked={active} onChange={() => toggle(dest.id)} className="ml-auto" /></label> })}
      </div>
      <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground"><strong className="text-foreground">Important:</strong> Selecting a destination records the planned workflow and does not automatically publish or upload products to connected platforms.</div>
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6"><h2 className="text-xl font-semibold">2. Campaign planner</h2><p className="mt-1 text-sm text-muted-foreground">Prepare a campaign brief and readiness check before building ad creatives and launching campaigns.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Campaign name<input value={campaignName} onChange={e=>setCampaignName(e.target.value)} className="mt-1.5 block w-full rounded-lg border bg-card p-3" /></label><label className="text-sm font-medium">Objective<select value={objective} onChange={e=>setObjective(e.target.value)} className="mt-1.5 block w-full rounded-lg border bg-card p-3"><option value="product_sales">Product sales</option><option value="traffic">Website traffic</option><option value="leads">Quote requests / leads</option><option value="remarketing">Remarketing</option><option value="brand_awareness">Brand awareness</option></select></label><label className="text-sm font-medium">Daily budget (optional)<input value={budget} onChange={e=>setBudget(e.target.value)} className="mt-1.5 block w-full rounded-lg border bg-card p-3" type="number" min={0} /></label><label className="text-sm font-medium">Target country<input value={country} onChange={e=>setCountry(e.target.value)} className="mt-1.5 block w-full rounded-lg border bg-card p-3" /></label></div>
        <button type="button" onClick={()=>setShowPlan(true)} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Build campaign checklist <Sparkles className="size-4" /></button>
        {showPlan && <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4"><h3 className="font-semibold">Campaign brief · preview only</h3><dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{campaignName || "Untitled campaign"}</dd></div><div><dt className="text-muted-foreground">Objective</dt><dd className="font-medium">{OBJECTIVE_LABELS[objective] || objective}</dd></div><div><dt className="text-muted-foreground">Destinations</dt><dd className="font-medium">{selectedNames.join(", ") || "None selected"}</dd></div><div><dt className="text-muted-foreground">Target country</dt><dd className="font-medium">{country || "Not specified"}</dd></div>{budget && <div><dt className="text-muted-foreground">Daily budget entered</dt><dd className="font-medium">{budget} (currency not set)</dd></div>}</dl><p className="mt-3 text-xs text-muted-foreground">Before launch: confirm currency, billing, targeting, ad copy and images, product eligibility, landing-page quality, conversion tracking, platform policies and a human approval of budget. This preview does not create or publish an ad.</p></div>}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6"><h2 className="text-xl font-semibold">3. Ads intelligence</h2><p className="mt-1 text-sm text-muted-foreground">The future reporting panel will combine connected platform data, without fabricating metrics.</p><div className="mt-5 space-y-3">{[{title:"Delivery & spend",desc:"Impressions, reach, spend, CPC and CPM by platform."},{title:"Sales performance",desc:"Clicks, quote leads, add-to-cart, purchases, conversion rate and ROAS where tracking is available."},{title:"Product-level health",desc:"Feed eligibility, disapprovals, missing images/prices, out-of-stock items and landing-page errors."},{title:"Recommendations",desc:"Flag wasted spend, products needing fixes, creative fatigue and budget opportunities based on real data."},{title:"Cross-channel comparison",desc:"Compare results by platform, campaign, product category, country and date range."}].map(x=><div key={x.title} className="flex gap-3 rounded-lg border border-border p-3"><BarChart3 className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-sm font-semibold">{x.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{x.desc}</p></div></div>)}</div><div className="mt-4"><Pill>Waiting for authorized reporting connections</Pill></div></div>
    </section>

    <section className="rounded-2xl border border-border bg-card p-5 md:p-6"><h2 className="text-xl font-semibold">4. Feed readiness & error queue</h2><p className="mt-1 text-sm text-muted-foreground">Track feed readiness, disapprovals and validation errors before starting campaigns.</p>
    <p className="text-xs text-muted-foreground">Integration status: dashboard UI only. No product uploads, platform account changes, audience uploads, campaign creation or ad spend are triggered by this page.</p>
  </div>
}
