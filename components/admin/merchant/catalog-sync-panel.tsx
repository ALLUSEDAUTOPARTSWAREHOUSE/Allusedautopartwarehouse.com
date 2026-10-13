"use client"

import { useActionState, useState, useRef } from "react"
import { RefreshCw, Upload, PlusCircle, Trash2, ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  bulkEditManualProducts,
  addManualProduct,
  removeManualProduct,
  syncProducts,
  uploadProductSheet,
  type CatalogActionState,
} from "@/app/admin/catalog-actions"

const initial: CatalogActionState = { ok: false, message: "" }
const inputClass = "rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
const labelClass = "flex flex-col gap-1 text-xs font-medium text-muted-foreground"

export interface CatalogSyncPanelProps {
  brands: { slug: string; label: string }[]
  manualProducts: {
    brand: string
    brandLabel: string
    slug: string
    name: string
    imageUrl: string | null
    category: string | null
    price: number | null
    source: "manual" | "upload"
    pagePath: string
    createdAt: string
  }[]
}

function SyncButton() {
  const [state, action, pending] = useActionState(syncProducts, initial)
  return (
    <form action={action} className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} aria-hidden="true" />
        {pending ? "Syncing…" : "Sync products"}
      </button>
      <p role="status" className={`text-xs ${state.ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
        {pending ? "" : state.message || "Republishes the catalog so the website and Google feed reflect the latest data."}
      </p>
    </form>
  )
}

function ManualProductForm({ brands }: { brands: { slug: string; label: string }[] }) {
  const [state, action, pending] = useActionState(addManualProduct, initial)

  return (
    <form key={state.ok ? state.message : "idle"} action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Brand
          <select name="brand" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose a brand
            </option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Part type
          <select name="category" defaultValue="engine" className={inputClass}>
            <option value="engine">Engine</option>
            <option value="transmission">Transmission</option>
          </select>
        </label>
      </div>
      <label className={labelClass}>
        Product name
        <input name="name" required maxLength={150} placeholder="2015 Toyota Camry 2.5L Engine" className={inputClass} />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className={labelClass}>
          Model
          <input name="model" maxLength={100} placeholder="Camry" className={inputClass} />
        </label>
        <label className={labelClass}>
          Year
          <input name="year" maxLength={20} placeholder="2015" className={inputClass} />
        </label>
        <label className={labelClass}>
          Price ($)
          <input name="price" type="number" min="1" step="0.01" inputMode="decimal" placeholder="Leave blank for quote-only" className={inputClass} />
        </label>
      </div>
      <label className={labelClass}>
        Image URL (https)
        <input name="imageUrl" type="url" placeholder="https://… real photo of this part" className={inputClass} />
      </label>
      <label className={labelClass}>
        Description
        <textarea name="description" rows={3} maxLength={5000} placeholder="Tested used part details…" className={`${inputClass} resize-y`} />
      </label>
      <div className="flex items-center justify-between gap-3">
        <p role="status" className={`text-xs ${state.ok ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
          {pending ? "" : state.message}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          {pending ? "Adding…" : "Add product"}
        </button>
      </div>
    </form>
  )
}

function UploadSheetForm({ brands }: { brands: { slug: string; label: string }[] }) {
  const [state, action, pending] = useActionState(uploadProductSheet, initial)

  return (
    <form key={state.ok ? state.message : "idle"} action={action} className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Upload an .xlsx sheet with <code className="rounded bg-muted px-1 py-0.5">Product Name</code> and{" "}
        <code className="rounded bg-muted px-1 py-0.5">Price</code> columns (optionally{" "}
        <code className="rounded bg-muted px-1 py-0.5">Model</code>, <code className="rounded bg-muted px-1 py-0.5">Year</code>,{" "}
        <code className="rounded bg-muted px-1 py-0.5">Product Type</code>, <code className="rounded bg-muted px-1 py-0.5">Image URL</code>,{" "}
        <code className="rounded bg-muted px-1 py-0.5">Description</code>). Acura-style migration workbooks and Price ($) columns are supported. Matching product URLs update existing uploads; missing prices become quote-only. Other products are not deleted.
      </p>
      <label className={labelClass}>
        Update fields
        <select name="mode" defaultValue="all" className={inputClass}>
          <option value="all">Add/update all fields</option>
          <option value="prices">Prices only (existing uploaded products)</option>
          <option value="images">Image URLs only (existing uploaded products)</option>
        </select>
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Brand
          <select name="brand" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose a brand
            </option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Spreadsheet file
          <input name="file" type="file" accept=".xlsx,.xls" required className={`${inputClass} py-1.5`} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs"><input name="confirmImport" type="checkbox" value="yes" />Confirm saving these updates; missing prices become quote-only. Unmatched old products stay unchanged.</label>
      <button type="submit" name="intent" value="preview" disabled={pending} className={inputClass}>Preview import — no changes</button>
      <div className="flex items-center justify-between gap-3">
        <p role="status" className={`text-xs ${state.ok ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
          {pending ? "" : state.message}
        </p>
        <button
          type="submit"
          name="intent" value="save"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {pending ? "Processing…" : "Save confirmed import"}
        </button>
      </div>
    </form>
  )
}

function ManualProductRow({ product }: { product: CatalogSyncPanelProps["manualProducts"][number] }) {
  const [state, action, pending] = useActionState(removeManualProduct, initial)
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
        <p className="text-xs text-muted-foreground">
          {product.brandLabel} · {product.price ? `$${product.price.toLocaleString()}` : "Quote only"} ·{" "}
          {product.source === "upload" ? "From upload" : "Manual"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={product.pagePath}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
        <form action={action}>
          <input type="hidden" name="brand" value={product.brand} />
          <input type="hidden" name="slug" value={product.slug} />
          <button
            type="submit"
            disabled={pending}
            aria-label={`Remove ${product.name}`}
            className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-60"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            Remove
          </button>
        </form>
      </div>
      {!state.ok && state.message && <p className="w-full text-xs text-destructive">{state.message}</p>}
    </li>
  )
}

function BulkProductForm({ brands, manualProducts }: CatalogSyncPanelProps) {
  const form = useRef<HTMLFormElement>(null)
  const [selectionCount, setSelectionCount] = useState(0)
  const [brand, setBrand] = useState(brands[0]?.slug ?? "")
  const [query, setQuery] = useState("")
  const [missingImage, setMissingImage] = useState(false)
  const [category, setCategory] = useState("")
  const [missingPrice, setMissingPrice] = useState(false)
  const [state, action, pending] = useActionState(bulkEditManualProducts, initial)
  const products = manualProducts.filter(p => p.brand === brand && p.name.toLowerCase().includes(query.toLowerCase()) && (!missingPrice || !p.price) && (!missingImage || !p.imageUrl) && (!category || p.category === category))
  return <form ref={form} action={action} onChange={() => setSelectionCount(form.current?.querySelectorAll('input[name="slug"]:checked').length ?? 0)} className="space-y-3 rounded-md border p-3">
    <h3 className="font-semibold">Single / bulk edits — uploaded and manual products</h3>
    <select aria-label="Brand filter" name="brand" value={brand} onChange={e => setBrand(e.target.value)} className={inputClass}>
      {brands.map(b => <option key={b.slug} value={b.slug}>{b.label}</option>)}
    </select>
    <input aria-label="Filter product name" placeholder="Filter product name" value={query} onChange={e => setQuery(e.target.value)} className={inputClass} />
    <label className="flex gap-2"><input type="checkbox" checked={missingPrice} onChange={e => setMissingPrice(e.target.checked)} />Missing prices only</label>
    <label className="flex gap-2"><input type="checkbox" checked={missingImage} onChange={e => setMissingImage(e.target.checked)} />Missing image URLs only</label>
    <select aria-label="Category filter" value={category} onChange={e => setCategory(e.target.value)} className={inputClass}><option value="">All categories</option><option value="engine">Engine</option><option value="transmission">Transmission</option></select>
    <div className="flex flex-wrap gap-2">
      <button type="button" className={inputClass} onClick={() => {
        const boxes = form.current?.querySelectorAll<HTMLInputElement>('input[name="slug"]')
        boxes?.forEach((box, index) => { box.checked = index < 200 })
        setSelectionCount(Math.min(boxes?.length ?? 0, 200))
      }}>Select filtered products (up to 200)</button>
      <button type="button" className={inputClass} onClick={() => {
        form.current?.querySelectorAll<HTMLInputElement>('input[name="slug"]').forEach(box => { box.checked = false })
        setSelectionCount(0)
      }}>Clear selection</button>
      <span className="text-sm">{selectionCount} selected · {products.length} matching uploaded/manual products</span>
    </div>
    {!products.length && <p role="status" className="text-sm">No uploaded/manual products match these filters. Upload this brand's sheet first, or clear the filters. Bundled catalog products are edited in the product cards below; this bulk panel does not remove them.</p>}
    <div key={`${brand}-${query}-${missingPrice}-${missingImage}-${category}-${state.message}`} className="max-h-64 overflow-auto">
      {products.map(p => <label key={p.slug} className="flex gap-2 py-1"><input name="slug" type="checkbox" value={p.slug} />{p.name}</label>)}
    </div>
    <select aria-label="Bulk action" name="operation" className={inputClass}>
      <option value="prices">Remove prices only (quote-only)</option>
      <option value="images">Remove image URLs only</option>
      <option value="delete">Delete uploaded/manual products</option>
    </select>
    <label className="flex gap-2"><input name="confirm" value="yes" type="checkbox" required />I confirm these removals for the selected products.</label>
    <button type="submit" disabled={pending || !products.length} className={inputClass}>{pending ? "Saving…" : "Apply to selected products"}</button>
    <p role="status">{state.message}</p>
  </form>
}

export function CatalogSyncPanel({ brands, manualProducts }: CatalogSyncPanelProps) {
  return (
    <section className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Sync products</h2>
          <p className="text-sm text-muted-foreground">Republish the catalog, or add products by hand or spreadsheet.</p>
        </div>
        <SyncButton />
      </div>

      <Tabs defaultValue="manual">
        <TabsList>
          <TabsTrigger value="manual">Add product manually</TabsTrigger>
          <TabsTrigger value="upload">Upload sheet</TabsTrigger>
        </TabsList>
        <TabsContent value="manual" className="pt-4">
          <ManualProductForm brands={brands} />
        </TabsContent>
        <TabsContent value="upload" className="pt-4">
          <UploadSheetForm brands={brands} />
        </TabsContent>
      </Tabs>

      <BulkProductForm brands={brands} manualProducts={manualProducts} />
      {manualProducts.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Manually added products ({manualProducts.length})
          </h3>
          <ul className="flex flex-col gap-2">
            {manualProducts.map((p) => (
              <ManualProductRow key={`${p.brand}/${p.slug}`} product={p} />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
