'use client'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { upload } from '@vercel/blob/client'
import { MAX_CATALOG_UPLOAD_BYTES, validCatalogUpload } from '@/lib/catalog-upload-policy'

type Staged = { pathname: string; brand: string; original_name: string; status: string; expected_bytes?: number | string }
type Preview = { inserted: number; skipped: number; missingPrices: number; message: string }
export function LargeCatalogUpload({ brands }: { brands: { slug: string; label: string }[] }) {
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [controller, setController] = useState<AbortController | null>(null)
  const [message, setMessage] = useState('')
  const [records, setRecords] = useState<Staged[]>([])
  const [listError, setListError] = useState(false)
  const [workingPath, setWorkingPath] = useState('')
  const [previews, setPreviews] = useState<Record<string, Preview>>({})
  const [rowMessages, setRowMessages] = useState<Record<string, string>>({})
  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/catalog-upload', { cache: 'no-store' })
      if (!response.ok) throw new Error('Unavailable')
      const data = await response.json()
      setRecords(data.uploads)
      setListError(false)
    } catch { setListError(true) }
  }, [])
  useEffect(() => {
    void refresh()
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, 30_000)
    return () => clearInterval(timer)
  }, [refresh])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const file = data.get('file')
    const brand = String(data.get('brand') || '')
    if (!(file instanceof File) || !validCatalogUpload(file.name, file.size) || !brands.some(item => item.slug === brand)) {
      setMessage('Choose a brand and an Excel or CSV file between 1 byte and 500 MB.')
      return
    }
    setBusy(true); setProgress(0); setMessage('Uploading to private storage. Keep this tab open.')
    const abort = new AbortController()
    setController(abort)
    let stalled = setTimeout(() => abort.abort(), 120_000)
    try {
      const extension = file.name.split('.').pop()!.toLowerCase()
      await upload(`catalog-staging/${brand}/${crypto.randomUUID()}.${extension}`, file, {
        access: 'private', multipart: true, handleUploadUrl: '/api/admin/catalog-upload',
        clientPayload: JSON.stringify({ name: file.name, size: file.size }),
        abortSignal: abort.signal,
        onUploadProgress: event => {
          clearTimeout(stalled)
          stalled = setTimeout(() => abort.abort(), 120_000)
          setProgress(Math.floor(event.percentage))
        },
      })
      setMessage('File transferred and staged. Next, preview the rows and explicitly import them into the catalog.')
      await refresh()
    } catch {
      setMessage('Upload stopped or failed. No import was requested. Use Check stored file below before retrying to avoid duplicates.')
      await refresh()
    } finally { clearTimeout(stalled); setController(null); setBusy(false) }
  }
  async function runImport(record: Staged, action: 'preview' | 'import' | 'reconcile') {
    if (action === 'import' && !window.confirm(`Import the previewed products for ${record.brand}? Existing matching uploaded products may be updated; unmatched products will not be deleted.`)) return
    setWorkingPath(record.pathname)
    setRowMessages(current => ({ ...current, [record.pathname]: action === 'reconcile' ? 'Checking stored file…' : action === 'preview' ? 'Validating workbook…' : 'Importing rows…' }))
    try {
      const response = await fetch(action === 'reconcile' ? '/api/admin/catalog-upload/reconcile' : '/api/admin/catalog-upload/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathname: record.pathname, action, confirm: action === 'import' }),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'Import failed.')
      if (action === 'reconcile') {
        setRowMessages(current => ({ ...current, [record.pathname]: result.message }))
        await refresh()
      } else if (action === 'preview') {
        setPreviews(current => ({ ...current, [record.pathname]: result }))
        setRowMessages(current => ({ ...current, [record.pathname]: `Preview: ${result.inserted} usable rows, ${result.skipped} skipped, ${result.missingPrices} missing prices. Nothing saved.` }))
      } else {
        setPreviews(current => { const next = { ...current }; delete next[record.pathname]; return next })
        setRowMessages(current => ({ ...current, [record.pathname]: result.message }))
        setMessage(result.message)
        await refresh()
      }
    } catch (error) {
      setRowMessages(current => ({ ...current, [record.pathname]: error instanceof Error ? error.message : 'Request failed. No success was confirmed.' }))
    } finally { setWorkingPath('') }
  }
  return <section className="space-y-4 rounded-xl border border-border p-4">
    <div>
      <h3 className="font-semibold">Large catalog upload · up to 500 MB staged</h3>
      <p className="mt-1 text-sm text-muted-foreground">Upload, preview, then import are separate steps. The importer currently accepts workbooks up to 20 MB per import; split larger workbooks into smaller files. Imports update saved catalog products and refresh website/feed caches. They do not submit products to Google Merchant or OpenAI Ads.</p>
    </div>
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label>Brand<select name="brand" required disabled={busy} className="ml-2 rounded border bg-background p-2"><option value="">Choose a brand</option>{brands.map(brand => <option key={brand.slug} value={brand.slug}>{brand.label}</option>)}</select></label>
      <label>Spreadsheet<input name="file" type="file" accept=".xlsx,.xls,.csv" required disabled={busy} className="ml-2" /></label>
      <p className="text-xs text-muted-foreground">Maximum staged file size: {MAX_CATALOG_UPLOAD_BYTES.toLocaleString()} bytes. Storage and transfer charges may apply.</p>
      <button disabled={busy} className="w-fit rounded border px-4 py-2 disabled:opacity-50">{busy ? `Uploading ${progress}%` : 'Upload spreadsheet'}</button>
      {busy && <button type="button" onClick={() => controller?.abort()} className="w-fit rounded border px-4 py-2">Cancel loading</button>}
      {busy && <progress aria-label="File upload progress" value={progress} max={100} className="w-full" />}
    </form>
    <p role="status" className="text-sm">{message}</p>
    <div className="space-y-3">
      <div className="flex items-center justify-between"><h4 className="text-sm font-semibold">Sheet status · recent staged files</h4><button type="button" onClick={() => void refresh()} className="rounded border px-3 py-2 text-sm">Refresh sheet status</button></div>
      {listError && <p role="alert" className="text-sm">Staging records are unavailable. Check database configuration; displayed records may be stale.</p>}
      {records.length === 0 && !listError && <p className="text-sm text-muted-foreground">No staged files found yet.</p>}
      {records.map(record => {
        const preview = previews[record.pathname]
        const active = workingPath === record.pathname
        return <article key={record.pathname} className="space-y-2 rounded-lg border p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0"><p className="break-all font-medium">{record.original_name}</p><p className="text-xs text-muted-foreground">{record.brand} · {record.expected_bytes ? `${(Number(record.expected_bytes) / (1024 * 1024)).toFixed(1)} MB · ` : ''}{active ? 'Processing request' : preview && record.status === 'uploaded' ? 'Preview ready · not imported' : record.status === 'uploaded' ? 'Stored · ready to preview' : record.status === 'imported' ? 'Imported to catalog' : 'Upload pending / unconfirmed'}</p></div>
            {record.status === 'uploading' && <button type="button" disabled={!!workingPath} onClick={() => void runImport(record, 'reconcile')} className="rounded border px-3 py-1.5 text-sm disabled:opacity-50">{active ? 'Checking…' : 'Check stored file'}</button>}
            {record.status === 'uploaded' && <div className="flex gap-2"><button type="button" disabled={!!workingPath} onClick={() => void runImport(record, 'preview')} className="rounded border px-3 py-1.5 text-sm disabled:opacity-50">{active ? 'Working…' : 'Preview import — no changes'}</button><button type="button" disabled={!!workingPath || !preview} onClick={() => void runImport(record, 'import')} className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-40">Confirm import</button></div>}
          </div>
          {preview && record.status === 'uploaded' && <p className="text-xs text-muted-foreground">Last preview: {preview.inserted} usable rows · {preview.skipped} skipped · {preview.missingPrices} missing prices. Re-preview after changing the file.</p>}
          {rowMessages[record.pathname] && <p role="status" className="text-sm">{rowMessages[record.pathname]}</p>}
        </article>
      })}
    </div>
  </section>
}
