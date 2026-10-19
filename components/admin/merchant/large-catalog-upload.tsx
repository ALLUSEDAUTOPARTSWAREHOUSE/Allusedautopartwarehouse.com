'use client'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { upload } from '@vercel/blob/client'
import { MAX_CATALOG_UPLOAD_BYTES, validCatalogUpload } from '@/lib/catalog-upload-policy'

type Staged = { pathname: string; brand: string; original_name: string; status: string }
export function LargeCatalogUpload({ brands }: { brands: { slug: string; label: string }[] }) {
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [records, setRecords] = useState<Staged[]>([])
  const [listError, setListError] = useState(false)
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
    try {
      const extension = file.name.split('.').pop()!.toLowerCase()
      await upload(`catalog-staging/${brand}/${crypto.randomUUID()}.${extension}`, file, {
        access: 'private', multipart: true, handleUploadUrl: '/api/admin/catalog-upload',
        clientPayload: JSON.stringify({ name: file.name, size: file.size }),
        onUploadProgress: event => setProgress(Math.floor(event.percentage)),
      })
      setMessage('File transferred. Waiting for server confirmation in the list below. Products have not been imported or published.')
      await refresh()
    } catch { setMessage('Upload failed. Check your session and private Blob configuration, then retry. Nothing was imported.') }
    finally { setBusy(false) }
  }
  return <section className="space-y-3 rounded-xl border border-border p-4">
    <h3 className="font-semibold">Large catalog upload · up to 500 MB</h3>
    <p className="text-sm text-muted-foreground">Direct multipart upload to private storage, bypassing the small form limit. Staging only: validation, replacement and publishing are not run by this uploader. Do not use the small import form for large files.</p>
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label>Brand<select name="brand" required disabled={busy} className="ml-2 rounded border bg-background p-2"><option value="">Choose a brand</option>{brands.map(brand => <option key={brand.slug} value={brand.slug}>{brand.label}</option>)}</select></label>
      <label>Spreadsheet<input name="file" type="file" accept=".xlsx,.xls,.csv" required disabled={busy} className="ml-2" /></label>
      <p className="text-xs text-muted-foreground">Maximum {MAX_CATALOG_UPLOAD_BYTES.toLocaleString()} bytes per file. Storage and transfer charges may apply.</p>
      <button disabled={busy} className="rounded border p-2 disabled:opacity-50">{busy ? `Uploading ${progress}%` : 'Upload to staging — no catalog changes'}</button>
      {busy && <progress aria-label="File upload progress" value={progress} max={100} className="w-full" />}
    </form>
    <p role="status" className="text-sm">{message}</p>
    <h4 className="text-sm font-semibold">Recent staged files</h4>
    {listError && <p role="alert" className="text-sm">Staging records are unavailable. Check database configuration; displayed records may be stale.</p>}
    <ul className="space-y-1 text-sm">{records.map(record => <li key={record.pathname}>{record.original_name} · {record.brand} · {record.status === 'uploaded' ? 'Stored — not validated or imported' : 'Awaiting confirmation (may be incomplete)'}</li>)}</ul>
  </section>
}
