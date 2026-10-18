"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"

const initialForm = { name: "", email: "", subject: "", message: "" }

export function ContactForm() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [error, setError] = useState("")

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    if (status === "error") setStatus("idle")
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("loading")
    setError("")

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: `[${form.subject}] ${form.message}`,
          source: "contact-form",
          pageUrl: window.location.pathname,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "We couldn't send your message.")
      setStatus("success")
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Something went wrong. Please try again.")
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="glass-card flex min-h-[450px] flex-col items-center justify-center rounded-2xl p-8 text-center sm:p-12">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/10">
          <CheckCircle2 className="size-8 text-emerald-300" aria-hidden="true" />
        </div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-primary">Message sent</p>
        <h2 className="text-2xl font-bold text-foreground">Thanks for reaching out.</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Your message is on its way to our team. We&apos;ll get back to you within one business day.</p>
        <button type="button" onClick={() => { setForm(initialForm); setStatus("idle") }} className="auapw-btn auapw-btn-silver mt-8">Send another message</button>
      </div>
    )
  }

  const fieldClass = "w-full rounded-xl border border-border/60 bg-input/80 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-2 focus:ring-primary/15"

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 sm:p-8" noValidate>
      <div className="mb-7 flex items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Send a message</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">How can we help?</h2>
        </div>
        <span className="hidden text-xs text-muted-foreground sm:block">Usually replies within 24 hours</span>
      </div>

      {status === "error" && <div className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</div>}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="contact-name" className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Name <span className="text-red-300">*</span></label>
          <input id="contact-name" name="name" required autoComplete="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} className={fieldClass} placeholder="Your full name" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="contact-email" className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Email <span className="text-red-300">*</span></label>
          <input id="contact-email" name="email" type="email" required autoComplete="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className={fieldClass} placeholder="you@example.com" />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <label htmlFor="contact-subject" className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Subject <span className="text-red-300">*</span></label>
        <input id="contact-subject" name="subject" required value={form.subject} onChange={(event) => updateField("subject", event.target.value)} className={fieldClass} placeholder="What can we help with?" />
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <label htmlFor="contact-message" className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Message <span className="text-red-300">*</span></label>
        <textarea id="contact-message" name="message" required rows={6} value={form.message} onChange={(event) => updateField("message", event.target.value)} className={`${fieldClass} resize-y`} placeholder="Tell us a little more about what you need..." />
      </div>

      <button type="submit" disabled={status === "loading"} className="auapw-btn auapw-btn-amber mt-6 w-full auapw-btn-lg sm:w-auto">
        {status === "loading" ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Sending...</> : <>Send message <ArrowRight className="size-4" aria-hidden="true" /></>}
      </button>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">By submitting, you agree to be contacted about your request. See our <a href="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</a>.</p>
    </form>
  )
}
