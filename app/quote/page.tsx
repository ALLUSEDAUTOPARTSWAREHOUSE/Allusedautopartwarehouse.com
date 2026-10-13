"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BrandLogosSection } from "@/components/brand-logos"

import { Zap, Shield, Truck, Phone, DollarSign, Mail, CheckCircle2, AlertCircle } from "lucide-react"
import { CAR_MAKES, CAR_MODELS, PART_CATEGORIES, YEARS, US_STATES, PHONE_DISPLAY, PHONE_SALES } from "@/lib/data"
import { getPartOptions } from "@/lib/parts-content"
import { useEffect, useState } from "react"

const CONTACT_EMAIL = "auapworld@gmail.com"

export default function QuotePage() {
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [part, setPart] = useState("")
  const [option, setOption] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [quoteId, setQuoteId] = useState<number | null>(null)
  const [productOfInterest, setProductOfInterest] = useState("")
  const [productUrl, setProductUrl] = useState("")
  const [customerEmailNotice, setCustomerEmailNotice] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedPart = params.get("part") ?? ""
    if (requestedPart === "Engine" || requestedPart === "Transmission") setPart(requestedPart)
    const requestedMake = params.get("make") ?? ""
    if (CAR_MAKES.includes(requestedMake)) setMake(requestedMake)
    const name = (params.get("productName") ?? "").trim().slice(0, 150)
    if (name) setProductOfInterest(name)
    const url = params.get("productUrl") ?? ""
    const productPath = url.split(/[?#]/, 1)[0]
    const pathParts = productPath.split("/").filter(Boolean)
    const safePath = productPath.startsWith("/") && !productPath.startsWith("//") && !productPath.includes(String.fromCharCode(92)) && !productPath.includes("://") && !pathParts.some((part) => part === "." || part === "..")
    if (safePath) setProductUrl(productPath)
  }, [])

  const models = make ? CAR_MODELS[make] || [] : []
  const partOptions = part ? getPartOptions(part) : []
  const selectClass = "w-full text-sm px-3 py-2.5 bg-[rgba(13,15,22,0.75)] border border-border/50 rounded-lg text-foreground appearance-none focus:border-primary/55 focus:ring-1 focus:ring-primary/20 outline-none transition-all"

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!make) { setError("Please select a vehicle make."); return }
    if (!name.trim()) { setError("Please enter your name."); return }
    if (phone.replace(/\D/g, "").length < 10) { setError("Please enter a valid phone number."); return }

    setLoading(true)
    try {
      const honeypot = new FormData(e.currentTarget).get("website")
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part, make, model, year, option, name, phone, email, state, zip, message,
          productName: productOfInterest,
          productUrl,
          source: productOfInterest && productUrl ? "product-page" : "quote-page",
          pageUrl: window.location.pathname + window.location.search,
          website: honeypot ?? "",
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? `Something went wrong. Please call us at ${PHONE_DISPLAY}.`)
        return
      }
      setQuoteId(data.id ?? null)
      setCustomerEmailNotice(
        data.emailStatus?.customerConfirmationAccepted
          ? `The email service accepted a confirmation for ${email.trim()}.`
          : email.trim()
            ? "Your request is saved, but the email service did not accept the confirmation email. A parts specialist will still call you."
            : "No email address was provided, so a confirmation email could not be sent. A parts specialist will still call you.",
      )
      setSuccess(true)
    } catch {
      setError(`Network error. Please call us at ${PHONE_DISPLAY}.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-[58px]">
        {/* Header */}
        <div className="relative border-b border-border/30 bg-cover bg-center" style={{ backgroundImage: "linear-gradient(to bottom right, rgba(13,15,22,0.78), rgba(13,15,22,0.72), rgba(13,15,22,0.88)), url('/images/heroes/hero-support.png')" }}>
          <div className="metal-line" />
          <div className="mx-auto max-w-[1280px] px-6 py-20">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/50" />
              <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-primary">No Obligation</span>
            </div>
            <h1 className="font-serif text-[clamp(1.75rem,4vw,3.5rem)] font-bold text-foreground">Request a Free Quote</h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-[520px]">
              Fill out the form and our team will find the best available parts from our 2,000+ yard network and call you back within one business day.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
            {/* Sidebar - shown after form on mobile */}
            <div className="flex flex-col gap-3 sm:gap-4 order-2 lg:order-1">
              {[
                { icon: Zap, title: "24-Hour Response", desc: "Our team contacts you with options within one business day" },
                { icon: Shield, title: "90-Day Warranty", desc: "Every part includes full return & replacement coverage" },
                { icon: DollarSign, title: "Best Price Match", desc: "We compare 2,000+ yards to find the lowest price" },
                { icon: Truck, title: "Nationwide Delivery", desc: "Ships to all 50 states in 7-10 business days" },
                { icon: Mail, title: "Direct Email", desc: `Your quote goes directly to ${CONTACT_EMAIL}` },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass-card rounded-lg p-6 flex items-start gap-4 border border-primary/5 shadow-md hover:shadow-lg hover:border-primary/10 transition-all">
                  <span className="text-lg shrink-0 mt-0.5"><Icon className="w-5 h-5 text-primary" /></span>
                  <div>
                    <p className="text-[13px] font-bold text-foreground mb-1">{title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
              <div className="glass-card rounded-lg p-6 border border-primary/5 shadow-md">
                <div className="metal-line mb-6" />
                <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground/70 mb-2 font-semibold">Prefer to Call?</p>
                <a href={`tel:${PHONE_SALES.replace(/-/g, "")}`} className="text-2xl font-bold text-foreground block mb-1">{PHONE_DISPLAY}</a>
                <p className="text-[11px] text-muted-foreground">Mon-Sat 8am-6pm PST</p>
                <div className="mt-5 pt-5 border-t border-border/20">
                  <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground/70 mb-2 font-semibold">Or Email Directly</p>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm font-bold text-primary hover:underline">{CONTACT_EMAIL}</a>
                </div>
              </div>
            </div>

            {/* Form - shown first on mobile */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              {productOfInterest ? (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div>
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">Product of interest</p>
                    <p className="mt-1 font-semibold text-foreground">{productOfInterest}</p>
                  </div>
                  {productUrl ? <a href={productUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary hover:underline">View product ↗</a> : null}
                </div>
              ) : null}
              {success ? (
                <div className="glass-card rounded-sm p-8 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-foreground mb-3">Quote Request Received!</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                    {quoteId ? <>Your reference is <strong>#{quoteId}</strong>. </> : null}
                    A parts specialist will call you within <strong>one business day</strong> with pricing and availability.
                  </p>
                  {customerEmailNotice ? <p role="status" className="mb-4 text-xs text-muted-foreground">{customerEmailNotice}</p> : null}
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    Need it faster? Call us at{" "}
                    <a href={`tel:${PHONE_SALES.replace(/-/g, "")}`} className="text-primary font-bold hover:underline">{PHONE_DISPLAY}</a>
                    {" "}or email{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary font-bold hover:underline">{CONTACT_EMAIL}</a>
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button onClick={() => { setSuccess(false); setMake(""); setModel(""); setPart(""); }} className="px-6 py-3 text-sm text-muted-foreground border border-border/50 rounded-sm hover:text-foreground hover:border-foreground/50 transition-all">
                      Submit Another Request
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-lg p-4 sm:p-8 lg:p-10 border border-primary/10 shadow-lg shadow-primary/5 bg-gradient-to-br from-card/50 via-card/30 to-background/20">
                  <div className="metal-line mb-8" />
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-8">Your Details</h2>

                  {error && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3" role="alert">
                      <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[0.62rem] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Full Name *</label>
                        <input type="text" required placeholder="John Smith" className={selectClass} value={name} onChange={e => setName(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[0.62rem] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Phone Number *</label>
                        <input type="tel" required placeholder="(555) 123-4567" className={selectClass} value={phone} onChange={e => setPhone(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[0.62rem] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Email Address</label>
                      <input type="email" placeholder="john@example.com" className={selectClass} value={email} onChange={e => setEmail(e.target.value)} />
                    </div>

                    <div className="h-px bg-border/30 my-8" />
                    <h3 className="font-serif text-xl font-bold text-foreground mb-7">Vehicle & Part Details</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[0.62rem] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Make *</label>
                        <select required className={selectClass} value={make} onChange={(e) => { setMake(e.target.value); setModel("") }}>
                          <option value="">Select Make</option>
                          {CAR_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[0.62rem] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Model</label>
                        <select className={selectClass} value={model} onChange={(e) => setModel(e.target.value)} disabled={!make}>
                          <option value="">{make ? "Select Model" : "Select Make First"}</option>
                          {models.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[0.62rem] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2.5">Year</label>
                        <select className={selectClass} value={year} onChange={(e) => setYear(e.target.value)}>
                          <option value="">Select Year</option>
                          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[0.62rem] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Part Needed</label>
                        <select className={selectClass} value={part} onChange={(e) => { setPart(e.target.value); setOption("") }}>
                          <option value="">Select Part</option>
                          <option value="Engine">Engine</option>
                          <option value="Transmission">Transmission</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[0.62rem] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Option</label>
                        <select className={selectClass} value={option} onChange={(e) => setOption(e.target.value)}>
                          <option value="">Select Option</option>
                          {partOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[0.62rem] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Your State</label>
                        <select className={selectClass} value={state} onChange={(e) => setState(e.target.value)}>
                          <option value="">Select State</option>
                          {US_STATES.map((s) => <option key={s.abbr} value={s.abbr}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[0.62rem] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">ZIP Code</label>
                        <input type="text" inputMode="numeric" maxLength={5} placeholder="ZIP Code" className={selectClass} value={zip} onChange={e => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[0.62rem] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Additional Notes (VIN, engine size, trim level, etc.)</label>
                      <textarea rows={3} placeholder="Any extra details that help us find the right part faster..." className={`${selectClass} resize-none`} value={message} onChange={e => setMessage(e.target.value)} />
                    </div>

                    <button type="submit" disabled={loading} className="auapw-btn auapw-btn-blue w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-[0.75rem] font-bold tracking-[0.18em] uppercase rounded-lg transition-all shadow-lg hover:shadow-xl hover:shadow-primary/20 mt-8 disabled:opacity-60">
                      <Mail className="w-4 h-4" />
                      {loading ? "Sending..." : "Get A Free Quote — Send Now"}
                    </button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Your request goes straight to our parts team. No spam, no obligation.
                    </p>
                    <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                      By Submitting, you authorize AUAPW LLC to text and call the number you provided with offers &amp; other information, possibly using automated means. Messages/Data rates apply. Consent is not a condition of purchase.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        <BrandLogosSection />
      </main>
      <Footer />
    </>
  )
}
