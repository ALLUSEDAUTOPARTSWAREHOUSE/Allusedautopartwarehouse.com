"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CAR_MAKES, CAR_MODELS, PART_CATEGORIES, YEARS } from "@/lib/data"
import { Search, Phone, MessageSquare, AlertCircle } from "lucide-react"
import { getPartsSearchUrl } from "@/lib/parts-search-routing"

interface SearchFormProps {
  compact?: boolean
}

export function SearchForm({ compact = false }: SearchFormProps) {
  const router = useRouter()
  const [year,  setYear]  = useState("")
  const [make,  setMake]  = useState("")
  const [model, setModel] = useState("")
  const [part,  setPart]  = useState("")
  const [makeError, setMakeError] = useState<string | null>(null)
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

    router.push(getPartsSearchUrl({
      year,
      make,
      model,
      partType: part,
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
            href="tel:+17088962383"
            className="hidden sm:flex items-center gap-1.5 text-[0.7rem] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Call (708) 896-2383"
          >
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            (708) 896-2383
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
              href="tel:+17088962383"
              className="auapw-btn auapw-btn-green auapw-btn-sm sm:auapw-btn-lg justify-center"
              aria-label="Call us at (708) 896-2383"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span className="sm:hidden">Call</span>
              <span className="hidden sm:inline">(708) 896-2383</span>
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
