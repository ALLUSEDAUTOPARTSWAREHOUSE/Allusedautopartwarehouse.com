"use client"

import { useState } from "react"
import { CAR_MAKES, CAR_MODELS, YEARS } from "@/lib/data"
import { Phone, AlertCircle, CheckCircle2, Mail, Loader2 } from "lucide-react"

const CONTACT_EMAIL = "auapworld@gmail.com"
const PHONE_DISPLAY = "1-888-887-4199"

interface QuoteFormProps {
  defaultPart?: "Engine" | "Transmission" | ""
  compact?: boolean
}

export function QuoteForm({ defaultPart = "", compact = false }: QuoteFormProps) {
  const [part, setPart]       = useState(defaultPart)
  const [make, setMake]       = useState("")
  const [model, setModel]     = useState("")
  const [year, setYear]       = useState("")
  const [option, setOption]   = useState("")
  const [name, setName]       = useState("")
  const [phone, setPhone]     = useState("")
  const [email, setEmail]     = useState("")
  const [zip, setZip]         = useState("")
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [quoteId, setQuoteId] = useState<number | null>(null)
  const [customerEmailNotice, setCustomerEmailNotice] = useState<string | null>(null)

  const models = make ? CAR_MODELS[make] || [] : []

  function reset() {
    setSuccess(false)
    setPart(defaultPart); setMake(""); setModel(""); setYear(""); setOption("")
    setName(""); setPhone(""); setEmail(""); setZip(""); setMessage("")
    setError(null)
    setCustomerEmailNotice(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!make)        { setError("Please select a vehicle make.");   return }
    if (!name.trim()) { setError("Please enter your name.");         return }
    if (phone.replace(/\D/g, "").length < 10) { setError("Please enter a valid phone number."); return }

    setLoading(true)
    try {
      const honeypot = new FormData(e.currentTarget).get("website")
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part, make, model, year, option, name, phone, email, zip, message,
          source: compact ? "quote-widget" : "quote-form",
          pageUrl: window.location.pathname,
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
            ? "Your quote request is saved, but the email service did not accept the confirmation email. Please check your inbox address; a parts specialist will still call you."
            : "No email address was provided, so the email service did not accept the confirmation email. A parts specialist will still call you.",
      )
      setSuccess(true)
    } catch {
      setError(`Network error. Please call us at ${PHONE_DISPLAY}.`)
    } finally {
      setLoading(false)
    }
  }

  const field =
    "w-full text-sm px-3 py-2.5 rounded-lg border border-border/50 bg-input text-foreground appearance-none outline-none transition-all focus:border-primary/60 focus:ring-1 focus:ring-primary/20 disabled:opacity-40"

  if (success) {
    return (
      <div className="glass-card rounded-xl p-8 flex flex-col items-center text-center gap-4">
        <CheckCircle2 className="w-14 h-14 text-green-400" />
        <h3 className="text-xl font-bold text-foreground">Quote Request Received!</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {quoteId ? <>Your reference is <strong>#{quoteId}</strong>. </> : null}
          A parts specialist will call you within <strong>one business day</strong> with pricing and availability.
        </p>
        {customerEmailNotice ? <p role="status" className="max-w-xl text-xs text-muted-foreground">{customerEmailNotice}</p> : null}
        <div className="w-full bg-card/50 border border-border/30 rounded-lg p-4 flex flex-col sm:flex-row gap-3 justify-center">
          <p className="text-xs text-muted-foreground w-full text-center mb-1 sm:hidden">Need it faster? Contact us directly:</p>
          <a href="tel:+18888874199" className="auapw-btn auapw-btn-green auapw-btn-sm">
            <Phone className="w-4 h-4" />
            {PHONE_DISPLAY}
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`} className="auapw-btn auapw-btn-teal auapw-btn-sm">
            <Mail className="w-4 h-4" />
            {CONTACT_EMAIL}
          </a>
        </div>
        <button onClick={reset} className="auapw-btn auapw-btn-silver auapw-btn-sm">
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <div
      className="glass-card rounded-xl h-full flex flex-col"
      style={{
        background: "rgba(7,9,15,0.45)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 8px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <div className={compact ? "p-4 flex flex-col h-full" : "p-5 sm:p-7 flex flex-col h-full"}>

        {/* Header */}
        <h3 className="text-xs font-black tracking-[0.25em] uppercase text-primary mb-5">
          Fill Form to Get Quote
        </h3>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col gap-3">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

          {/* Row 1: Part + Make */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="qf-part" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                Select Part
              </label>
              <select id="qf-part" className={field} value={part} onChange={(e) => setPart(e.target.value as '' | 'Engine' | 'Transmission')}>
                <option value="">Select Part</option>
                <option value="Engine">Engine</option>
                <option value="Transmission">Transmission</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="qf-make" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                Select Make <span className="text-red-400">*</span>
              </label>
              <select
                id="qf-make" className={field} value={make}
                onChange={(e) => { setMake(e.target.value); setModel("") }}
                aria-required="true"
              >
                <option value="">Select Make</option>
                {CAR_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Model */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="qf-model" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
              Select Model
            </label>
            <select
              id="qf-model" className={field} value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!make}
            >
              <option value="">{make ? "Select Model" : "Select Make First"}</option>
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Row 3: Year + Option */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="qf-year" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                Select Year
              </label>
              <select id="qf-year" className={field} value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">Select Year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="qf-option" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                Select Option
              </label>
              <select id="qf-option" className={field} value={option} onChange={(e) => setOption(e.target.value)}>
                <option value="">Select Option</option>
                <option value="2WD">2WD</option>
                <option value="4WD">4WD</option>
                <option value="AWD">AWD</option>
                <option value="FWD">FWD</option>
                <option value="RWD">RWD</option>
              </select>
            </div>
          </div>

          {/* Row 4: Name + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="qf-name" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                Your Name <span className="text-red-400">*</span>
              </label>
              <input
                id="qf-name" type="text" className={field}
                placeholder="Full Name" value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="qf-phone" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                id="qf-phone" type="tel" className={field}
                placeholder="Phone Number" value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Row 5: Email + ZIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="qf-email" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                Email Address
              </label>
              <input
                id="qf-email" type="email" className={field}
                placeholder="Email Address" value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="qf-zip" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                ZIP Code
              </label>
              <input
                id="qf-zip" type="text" inputMode="numeric" className={field}
                placeholder="ZIP Code" maxLength={5} value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                autoComplete="postal-code"
              />
            </div>
          </div>

          {/* Row 6: Message (hidden in compact) */}
          {!compact && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="qf-msg" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                Additional Details
              </label>
              <textarea
                id="qf-msg" className={`${field} resize-none min-h-[70px]`}
                placeholder="Any additional details about the part you need..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          )}

          {/* Submit */}
          <div className="mt-auto pt-1">
            <button
              type="submit"
              disabled={loading}
              className="auapw-btn auapw-btn-amber w-full auapw-btn-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "GET A QUOTE"
              )}
            </button>
            <p className="text-[9px] text-muted-foreground mt-2 leading-relaxed text-center">
              By submitting, you authorize AUAPW LLC to contact the number provided with offers &amp; information.
              Messages/data rates may apply.{" "}
              <a href="/privacy-policy" className="underline hover:text-foreground transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>

        </form>
      </div>
    </div>
  )
}
