"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Facebook,
  Globe2,
  Instagram,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from "lucide-react"

type Destination = "google" | "openai" | "facebook" | "instagram" | "tiktok" | "pinterest"
const OBJECTIVE_LABELS: Record<string, string> = {
  product_sales: "Product sales",
  traffic: "Website traffic",
  leads: "Quote requests / leads",
  remarketing: "Remarketing",
  brand_awareness: "Brand awareness",
}

const DESTINATIONS: {
  id: Destination
  name: string
  detail: string
  status: string
  icon: typeof ShoppingBag
  href: string
}[] = [
  {
    id: "google",
    name: "Google Merchant Center",
    detail: "Shopping listings, price and availability",
    status: "Connection must be verified",
    icon: Globe2,
    href: "/admin/merchant",
  },
  {
    id: "openai",
    name: "ChatGPT Ads product feed",
    detail: "Product discovery and eligible ad placements",
    status: "Feed connection not verified",
    icon: Sparkles,
    href: "https://ads.openai.com/",
  },
  {
    id: "facebook",
    name: "Facebook catalog & ads",
    detail: "Meta catalog and campaign destinations",
    status: "Connect account to enable",
    icon: Facebook,
    href: "/admin/marketing/social",
  },
  {
    id: "instagram",
    name: "Instagram shopping & ads",
    detail: "Product discovery and social creative",
    status: "Connect account to enable",
    icon: Instagram,
    href: "/admin/marketing/social",
  },
  {
    id: "tiktok",
    name: "TikTok ads/catalog",
    detail: "Short-form creative and catalog ads",
    status: "Connect account to enable",
    icon: Activity,
    href: "/admin/marketing/social",
  },
  {
    id: "pinterest",
    name: "Pinterest product feed",
    detail: "Visual product discovery",
    status: "Connect account to enable",
    icon: PackageCheck,
    href: "/admin/marketing/social",
  },
]

function Pill({ children, good = false }: { children: React.ReactNode; good?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
        good
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      }`}
    >
      {good ? <CheckCircle2 className="size-3.5" /> : <CircleAlert className="size-3.5" />}
      {children}
    </span>
  )
}

export function AdsControlCenter() {
  const [selected, setSelected] = useState<Destination[]>(["google", "openai"])
  const [objective, setObjective] = useState("product_sales")
  const [campaignName, setCampaignName] = useState("AUAPW parts catalog campaign")
  const [budget, setBudget] = useState("")
  const [country, setCountry] = useState("India")
  const [showPlan, setShowPlan] = useState(false)

  const toggle = (id: Destination) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const selectedNames = useMemo(
    () => DESTINATIONS.filter((destination) => selected.includes(destination.id)).map((destination) => destination.name),
    [selected],
  )

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-7">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">AUAPW · Marketing operations</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Product feeds & Ads Center</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Keep your catalog synced, validate destinations, and draft ad campaigns without sending live spend.
          </p>
        </div>

        <Link
          href="/admin/products"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Upload or manage products
          <ArrowUpRight className="size-4" />
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Catalog source",
            value: "AUAPW product catalog",
            note: "Website remains the source of truth",
            icon: ShoppingBag,
          },
          {
            label: "Feed destinations",
            value: `${selected.length} selected`,
            note: "Selection drives campaign planning",
            icon: RefreshCw,
          },
          {
            label: "Primary objective",
            value: OBJECTIVE_LABELS[objective] ?? "Product sales",
            note: "Campaign brief uses this intent",
            icon: BarChart3,
          },
          {
            label: "Ad readiness",
            value: "Draft mode",
            note: "No live platform actions from this dashboard",
            icon: CheckCircle2,
          },
        ].map(({ label, value, note, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="size-4 text-primary" />
            </div>
            <div className="mt-4 text-xl font-semibold">{value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">1. Choose product sync destinations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select your feed and catalog destinations. This is a planning record only.
            </p>
          </div>
          <Pill good={selected.length > 0}>{selected.length} active</Pill>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {DESTINATIONS.map((destination) => {
            const Icon = destination.icon
            const active = selected.includes(destination.id)

            return (
              <label
                key={destination.id}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                  active
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border bg-muted/25 hover:border-border/80"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary"
                  checked={active}
                  onChange={() => toggle(destination.id)}
                />

                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                    <Icon className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{destination.name}</span>
                      <a
                        href={destination.href}
                        target={destination.href.startsWith("http") ? "_blank" : undefined}
                        rel={destination.href.startsWith("http") ? "noreferrer" : undefined}
                        className="inline-flex items-center gap-1 text-xs text-primary"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Open <ArrowUpRight className="size-3.5" />
                      </a>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{destination.detail}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{destination.status}</span>
                      <Pill good={active}>{active ? "Selected" : "Not selected"}</Pill>
                    </div>
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <strong className="text-foreground">Important:</strong> Selecting a destination records the preferred sync plan.
          It does not connect accounts, upload products, or start paid media campaigns.
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <h2 className="text-xl font-semibold">2. Campaign planner</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Prepare a campaign brief for the selected destinations and target market.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Campaign name
              <input
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-0 transition focus:border-primary"
              />
            </label>

            <label className="text-sm font-medium">
              Country
              <input
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-0 transition focus:border-primary"
              />
            </label>

            <label className="text-sm font-medium">
              Budget
              <input
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="e.g. ₹45,000/month"
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-0 transition focus:border-primary"
              />
            </label>

            <label className="text-sm font-medium">
              Objective
              <select
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
              >
                {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowPlan(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Build campaign brief
            <Sparkles className="size-4" />
          </button>

          {showPlan && (
            <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <h3 className="font-semibold">Campaign brief · preview only</h3>
              <dl className="mt-3 grid gap-2 text-sm text-foreground">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">{campaignName || "Untitled campaign"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Objective</dt>
                  <dd>{OBJECTIVE_LABELS[objective] ?? OBJECTIVE_LABELS.product_sales}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Destinations</dt>
                  <dd className="text-right">{selectedNames.length ? selectedNames.join(", ") : "No destinations selected"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Budget</dt>
                  <dd>{budget || "Not set"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Market</dt>
                  <dd>{country}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <h2 className="text-xl font-semibold">3. Ads intelligence</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The future recommendation layer will review product feed coverage, audience fit, and campaign pacing.
          </p>

          <div className="mt-5 space-y-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="font-medium text-foreground">Recommended next step</p>
              <p className="mt-1 text-muted-foreground">
                Validate catalog integrity before launching campaigns across selected destinations.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="font-medium text-foreground">Data quality signal</p>
              <p className="mt-1 text-muted-foreground">High confidence for product feed parity and price consistency.</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="font-medium text-foreground">Audience note</p>
              <p className="mt-1 text-muted-foreground">Focus on parts-intent and local-market remarketing once the feed is approved.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h2 className="text-xl font-semibold">4. Feed readiness & error queue</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review catalog health, destination readiness, and issues before launch is considered.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Feed health", value: "92% ready", good: true },
            { label: "Missing product info", value: "18 SKUs", good: false },
            { label: "Price mismatch alerts", value: "3 warnings", good: false },
            { label: "Platform queue", value: "Clear", good: true },
          ].map(({ label, value, good }) => (
            <div key={label} className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Pill good={good}>{good ? "Healthy" : "Action"}</Pill>
              </div>
              <div className="mt-3 text-lg font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Integration status: dashboard UI only. No product uploads, platform account changes, audience uploads, campaign
        creation or ad spend are triggered by this screen.
      </p>
    </div>
  )
}
