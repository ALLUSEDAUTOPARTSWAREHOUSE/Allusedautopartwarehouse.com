"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CAR_MAKES, CAR_MODELS, PART_CATEGORIES, YEARS, US_STATES } from "@/lib/data"
import { Search, Phone, MessageSquare, AlertCircle } from "lucide-react"
import { getPartsSearchUrl } from "@/lib/parts-search-routing"

interface SearchFormProps {
  compact?: boolean
}

const ZIP_RE = /^\d{5}$/

export function SearchForm({ compact = false }: SearchFormProps) {
  const router = useRouter()
  const [year,  setYear]  = useState("")
  const [make,  setMake]  = useState("")
  const [model, setModel] = useState("")
  const [part,  setPart]  = useState("")
  const [state, setState] = useState("")
  const [city,  setCity]  = useState("")
  const [zip,   setZip]   = useState("")

  const [makeError, setMakeError] = useState<string | null>(null)
  const [zipError,  setZipError]  = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const models = make ? CAR_MODELS[make] || [] : []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)

    if (!make) {
      setMakeError("Please select a vehicle make to search.")
      return
    }
    setMakeError(null)

    const zipErr = zip && !ZIP_RE.test(zip) ? "ZIP code must be exactly 5 digits." : null
    setZipError(zipErr)
    if (zipErr) return

    const location = [city.trim(), state].filter(Boolean).join(", ")
    router.push(getPartsSearchUrl({
      year,
      make,
      model,
      partType: part,
      location,
      zipCode: zip,
    }))
  }

  const base  = "w-full text-sm px-3.5 py-3 bg-[rgba(13,15,22,0.75)] backdrop-blur-sm border rounded-lg text-foreground appearance-none outline-none transition-all"
  const cls   = (err: boolean) =>
    `${base} ${err
      ? "border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
      : "border-border/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
    }`

  return (
    <div className={`glass-card rounded-xl overflow-hidden ${compact ? "shadow-md" : "shadow-[0_16px_48px_rgba(0,0,0,0.35)]"}`}>
      <div className="metal-line" />

      <div className={compact ? "p-4 sm:p-5" : "p-6 sm:p-8 lg:p-10"}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-[0.65rem] font-black tracking-[0.25em] uppercase text-primary">
              Find Your Part
            </span>
          </div>
          <a
            href="tel:+18888874199"
            className="hidden sm:flex items-center gap-1.5 text-[0.7rem] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Call 1-888-887-4199"
          >
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            1-888-887-4199
          </a>
        </div>

        <form onSubmit={handleSubmit} noValidate aria-label="Part search form">

          {/* Row 1: Year / Make / Model / Part */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">

            {/* Year */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sf-year" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                Year
              </label>
              <select id="sf-year" className={cls(false)} value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">Select Year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Make */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sf-make" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                Make <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <select
                id="sf-make"
                className={cls(!!makeError && submitted)}
                value={make}
                onChange={(e) => { setMake(e.target.value); setModel(""); setMakeError(null) }}
                aria-required="true"
                aria-invalid={!!makeError}
                aria-describedby={makeError ? "sf-make-err" : undefined}
              >
                <option value="">Select Make</option>
                {CAR_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              {makeError && submitted && (
                <p id="sf-make-err" role="alert" className="flex items-center gap-1 text-[11px] text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {makeError}
                </p>
              )}
            </div>

            {/* Model */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sf-model" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                Model
              </label>
              <select
                id="sf-model" className={cls(false)} value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={!make} aria-disabled={!make}
              >
                <option value="">{make ? "Select Model" : "Select Make First"}</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Part Type */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sf-part" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                Part Type
              </label>
              <select id="sf-part" className={cls(false)} value={part} onChange={(e) => setPart(e.target.value)}>
                <option value="">Select Part</option>
                {PART_CATEGORIES.map((cat) => (
                  <optgroup key={cat.id} label={cat.label}>
                    {cat.parts.map((p) => <option key={p} value={p}>{p}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

          </div>

          {/* Row 2: State / City / ZIP — hidden in compact mode */}
          {!compact && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">

              {/* State */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sf-state" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                  State
                </label>
                <select id="sf-state" className={cls(false)} value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="">All States</option>
                  {US_STATES.map((s) => <option key={s.abbr} value={s.abbr}>{s.name}</option>)}
                </select>
              </div>

              {/* City */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sf-city" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                  City <span className="font-normal normal-case tracking-normal text-muted-foreground/50">(optional)</span>
                </label>
                <input
                  id="sf-city" type="text" className={cls(false)}
                  placeholder="e.g. Los Angeles"
                  value={city} onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                />
              </div>

              {/* ZIP */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sf-zip" className="text-[0.6rem] font-black tracking-[0.2em] uppercase text-muted-foreground">
                  ZIP Code
                </label>
                <input
                  id="sf-zip" type="text" inputMode="numeric"
                  className={cls(!!zipError && submitted)}
                  placeholder="e.g. 90001" maxLength={5}
                  value={zip}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 5)
                    setZip(v)
                    setZipError(v && !ZIP_RE.test(v) ? "ZIP must be 5 digits." : null)
                  }}
                  aria-invalid={!!zipError}
                  aria-describedby={zipError ? "sf-zip-err" : undefined}
                  autoComplete="postal-code"
                />
                {zipError && submitted && (
                  <p id="sf-zip-err" role="alert" className="flex items-center gap-1 text-[11px] text-red-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {zipError}
                  </p>
                )}
              </div>

            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="auapw-btn auapw-btn-blue flex-1 auapw-btn-lg justify-center"
              aria-label="Search available parts"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              Search Available Parts
            </button>
            <a
              href="tel:+18888874199"
              className="auapw-btn auapw-btn-green auapw-btn-sm sm:auapw-btn-lg justify-center"
              aria-label="Call us at 1-888-887-4199"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span className="sm:hidden">Call</span>
              <span className="hidden sm:inline">1-888-887-4199</span>
            </a>
            <a
              href="/quote"
              className="auapw-btn auapw-btn-amber auapw-btn-sm sm:auapw-btn-lg justify-center"
              aria-label="Get a free quote"
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              <span>Get Quote</span>
            </a>
          </div>

        </form>
      </div>
    </div>
  )
}
