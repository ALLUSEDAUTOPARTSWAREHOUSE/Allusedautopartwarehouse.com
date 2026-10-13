'use client'

import { useEffect, useState } from 'react'

export function MerchantAccountSettings({ defaultId, defaultName }: { defaultId: string; defaultName: string }) {
  const [id, setId] = useState(defaultId)
  const [name, setName] = useState(defaultName)
  const [message, setMessage] = useState('')
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('auapw-merchant-display') || 'null')
      if (saved && typeof saved.id === 'string' && /^\d{1,30}$/.test(saved.id) && typeof saved.name === 'string') {
        setId(saved.id); setName(saved.name.slice(0, 100))
      }
    } catch { setMessage('Saved display settings could not be loaded.') }
  }, [])
  function save() {
    if (!/^\d{1,30}$/.test(id) || !name.trim()) { setMessage('Enter a numeric Merchant ID and account name.'); return }
    try {
      localStorage.setItem('auapw-merchant-display', JSON.stringify({ id, name: name.trim() }))
      setMessage('Display details saved in this browser only. Google account was not changed.')
    } catch { setMessage('Browser storage is unavailable. Details were not saved.') }
  }
  return <div className="space-y-3 rounded-lg border p-4">
    <h3 className="font-semibold">Merchant account display settings</h3>
    <p className="text-xs text-muted-foreground">Reference details only. No Google authorization, account switching or direct uploads are implemented.</p>
    <label className="block text-sm">Account name<input value={name} maxLength={100} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded border bg-background p-2" /></label>
    <label className="block text-sm">Merchant Center ID<input value={id} inputMode="numeric" maxLength={30} onChange={e => setId(e.target.value)} className="mt-1 block w-full rounded border bg-background p-2" /></label>
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={save} className="rounded border px-3 py-2 text-sm">Save display details</button>
      <button type="button" onClick={() => {
        try { localStorage.removeItem('auapw-merchant-display'); setId(defaultId); setName(defaultName); setMessage('Default display details restored.') }
        catch { setMessage('Could not clear saved settings.') }
      }} className="rounded border px-3 py-2 text-sm">Reset defaults</button>
      <button type="button" disabled title="Google authorization integration required" className="rounded border px-3 py-2 text-sm opacity-50">Connect / switch Google account — not available</button>
      <button type="button" disabled title="Direct upload integration required" className="rounded border px-3 py-2 text-sm opacity-50">Upload to Google — not available</button>
    </div>
    <p role="status" className="text-sm">{message}</p>
  </div>
}
