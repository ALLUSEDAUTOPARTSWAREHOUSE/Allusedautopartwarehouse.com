'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import Link from 'next/link'
import useSWR from 'swr'

export interface ChatPartHit {
  name: string
  year: string
  model: string
  brandLabel: string
  category: string
  price: number | null
  url: string
  warranty: string
  shipping: string
  availability: string
  compatibility: string
}

interface PartsData {
  hits: ChatPartHit[]
  popular: ChatPartHit[]
  brands: { label: string; slug: string; count: number; url: string }[]
}

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json() as Promise<PartsData>)

function priceLabel(price: number | null) {
  return typeof price === 'number' ? `$${price.toLocaleString('en-US')}` : 'Call for price'
}

export function ChatPartsPanel({
  onQuote,
}: {
  onQuote: (part: 'Engine' | 'Transmission' | '') => void
}) {
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')

  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (category) params.set('category', category)
  const { data, isLoading } = useSWR<PartsData>(`/api/chat/parts?${params.toString()}`, fetcher)

  const results = query ? data?.hits ?? [] : data?.popular ?? []

  function submit(e?: FormEvent) {
    e?.preventDefault()
    setQuery(draft.trim())
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    e.preventDefault()
    submit()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
      <form onSubmit={submit} className="flex gap-2">
        <label className="sr-only" htmlFor="chat-parts-search">
          Search used engines and transmissions
        </label>
        <input
          id="chat-parts-search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="e.g. 2018 Ford F-150 engine"
          className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
        <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {[
          { id: '', label: 'All parts' },
          { id: 'engine', label: 'Engines' },
          { id: 'transmission', label: 'Transmissions' },
        ].map((opt) => (
          <button
            key={opt.id || 'all'}
            type="button"
            onClick={() => setCategory(opt.id)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              category === opt.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-muted text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <Link href="/brands" className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-primary">
          All brands
        </Link>
        <Link href="/used-engines" className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-primary">
          Used engines
        </Link>
        <Link href="/used-transmissions" className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-primary">
          Used transmissions
        </Link>
      </div>

      {isLoading ? <p className="text-xs text-muted-foreground">Loading parts…</p> : null}

      {!isLoading && query && results.length === 0 ? (
        <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          No exact matches. Include a make (Ford, Chevy, Toyota…) or
          {' '}
          <button type="button" className="underline" onClick={() => onQuote('')}>
            fill the quote form
          </button>
          {' '}and a specialist will look it up.
        </div>
      ) : null}

      <ul className="flex flex-col gap-2">
        {results.map((hit) => (
          <li key={hit.url} className="rounded-lg border border-border bg-card p-3">
            <p className="text-sm font-semibold leading-snug text-foreground">{hit.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {[hit.year, hit.brandLabel, hit.model].filter(Boolean).join(' ')}
              {hit.compatibility ? ` · ${hit.compatibility}` : ''}
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">{priceLabel(hit.price)}</p>
            <p className="text-[11px] text-muted-foreground">
              {hit.availability}
              {hit.warranty ? ` · ${hit.warranty}` : ''}
              {hit.shipping ? ` · ${hit.shipping}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href={hit.url} className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                View details
              </Link>
              <button
                type="button"
                onClick={() => onQuote(/trans/i.test(hit.category) ? 'Transmission' : 'Engine')}
                className="rounded-md border border-border px-2.5 py-1 text-[11px] font-semibold"
              >
                Get a quote
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!query && data?.brands?.length ? (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Shop by brand</p>
          <div className="flex flex-wrap gap-1.5">
            {data.brands.map((brand) => (
              <Link
                key={brand.slug}
                href={brand.url}
                className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] font-semibold text-foreground"
              >
                {brand.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
