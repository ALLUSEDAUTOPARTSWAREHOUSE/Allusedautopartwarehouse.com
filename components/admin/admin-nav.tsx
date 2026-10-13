'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', color: 'border-blue-500 text-blue-800 dark:text-blue-300', selected: 'bg-blue-100 dark:bg-blue-950' },
  { href: '/admin/orders', label: 'Orders', color: 'border-amber-500 text-amber-800 dark:text-amber-300', selected: 'bg-amber-100 dark:bg-amber-950' },
  { href: '/admin/quotes', label: 'Quotes', color: 'border-orange-500 text-orange-800 dark:text-orange-300', selected: 'bg-orange-100 dark:bg-orange-950' },
  { href: '/admin/customers', label: 'Customers', color: 'border-cyan-500 text-cyan-800 dark:text-cyan-300', selected: 'bg-cyan-100 dark:bg-cyan-950' },
  { href: '/admin/chats', label: 'Chats', color: 'border-teal-500 text-teal-800 dark:text-teal-300', selected: 'bg-teal-100 dark:bg-teal-950' },
  { href: '/admin/ai-chat', label: 'AI Chat', color: 'border-violet-500 text-violet-800 dark:text-violet-300', selected: 'bg-violet-100 dark:bg-violet-950' },
  { href: '/admin/merchant', label: 'Google Feed', color: 'border-emerald-500 text-emerald-800 dark:text-emerald-300', selected: 'bg-emerald-100 dark:bg-emerald-950' },
  { href: '/admin/products', label: 'Products', color: 'border-indigo-500 text-indigo-800 dark:text-indigo-300', selected: 'bg-indigo-100 dark:bg-indigo-950' },
  { href: '/admin/payments', label: 'Payments', color: 'border-lime-500 text-lime-800 dark:text-lime-300', selected: 'bg-lime-100 dark:bg-lime-950' },
  { href: '/admin/team', label: 'Team', color: 'border-pink-500 text-pink-800 dark:text-pink-300', selected: 'bg-pink-100 dark:bg-pink-950' },
  { href: '/admin/settings', label: 'Settings', color: 'border-slate-500 text-slate-800 dark:text-slate-300', selected: 'bg-slate-100 dark:bg-slate-950' },
] as const

type TabPreference = { href: string; label: string; visible: boolean; palette: number }
const STORAGE_KEY = 'auapw-admin-tabs-v1'
const defaults = (): TabPreference[] => ADMIN_NAV.map((tab, palette) => ({ href: tab.href, label: tab.label, visible: true, palette }))

/** Local display preferences never grant access or change the server routes. */
export function AdminNav() {
  const pathname = usePathname()
  const [tabs, setTabs] = useState<TabPreference[]>(defaults)
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (!Array.isArray(saved)) return
      const seen = new Set<string>()
      const valid: TabPreference[] = []
      for (const item of saved) {
        const base = ADMIN_NAV.find(tab => tab.href === item?.href)
        if (!base || seen.has(base.href)) continue
        seen.add(base.href)
        valid.push({ href: base.href, label: typeof item.label === 'string' && item.label.trim() ? item.label.trim().slice(0, 32) : base.label,
          visible: base.href === '/admin/settings' || base.href === '/admin/dashboard' || item.visible !== false,
          palette: Number.isInteger(item.palette) && item.palette >= 0 && item.palette < ADMIN_NAV.length ? item.palette : 0 })
      }
      setTabs([...valid, ...defaults().filter(tab => !seen.has(tab.href))])
    } catch { setNotice('Saved tab preferences could not be loaded. Defaults are shown.') }
  }, [])
  function update(index: number, patch: Partial<TabPreference>) {
    setTabs(current => current.map((tab, i) => i === index ? { ...tab, ...patch } : tab))
  }
  function move(index: number, direction: number) {
    setTabs(current => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }
  function save() {
    if (tabs.some(tab => !tab.label.trim())) { setNotice('Every tab needs a label.'); return }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
      setNotice('Tab preferences saved in this browser.')
      setEditing(false)
    } catch { setNotice('This browser could not save preferences. Changes apply only until reload.') }
  }
  function reset() {
    setTabs(defaults())
    try { localStorage.removeItem(STORAGE_KEY); setNotice('Default tabs restored.') }
    catch { setNotice('Defaults restored for this visit; browser storage could not be cleared.') }
  }
  return <div className="min-w-0">
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1">
        {tabs.filter(tab => tab.visible || pathname === tab.href || pathname?.startsWith(`${tab.href}/`)).map(tab => {
          const active = pathname === tab.href || pathname?.startsWith(`${tab.href}/`)
          const tone = ADMIN_NAV[tab.palette]
          return <li key={tab.href}><Link href={tab.href} aria-current={active ? 'page' : undefined}
            className={`block whitespace-nowrap rounded-md border-b-2 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 ${tone.color} ${active ? `${tone.selected} font-semibold underline underline-offset-4` : 'hover:bg-muted'}`}>
            {tab.label}
          </Link></li>
        })}
      </ul>
    </nav>
    <button type="button" aria-expanded={editing} aria-controls="tab-editor" onClick={() => setEditing(value => !value)} className="mt-1 text-xs text-primary underline">Customize tabs</button>
    {editing && <section id="tab-editor" aria-label="Edit navigation tabs" className="mt-2 max-h-80 overflow-auto rounded-md border bg-card p-3">
      <p className="mb-2 text-xs">Display preferences for this browser only. Dashboard and Settings stay accessible. Hiding a tab does not change permissions.</p>
      {tabs.map((tab, index) => <div key={tab.href} className="mb-2 flex flex-wrap items-center gap-2">
        <label className="text-xs"><input type="checkbox" checked={tab.visible} disabled={tab.href === '/admin/settings' || tab.href === '/admin/dashboard'} onChange={event => update(index, { visible: event.target.checked })} /> Show</label>
        <input aria-label={`Label for ${tab.href}`} maxLength={32} value={tab.label} onChange={event => update(index, { label: event.target.value })} className="w-36 rounded border bg-background px-2 py-1 text-sm" />
        <select aria-label={`Color for ${tab.href}`} value={tab.palette} onChange={event => update(index, { palette: Number(event.target.value) })} className="rounded border bg-background text-sm">
          {['Blue', 'Amber', 'Orange', 'Cyan', 'Teal', 'Violet', 'Emerald', 'Indigo', 'Lime', 'Pink', 'Slate'].map((name, i) => <option key={name} value={i}>{name}</option>)}
        </select>
        <button type="button" aria-label={`Move ${tab.label} earlier`} disabled={index === 0} onClick={() => move(index, -1)} className="rounded border px-2 disabled:opacity-40">↑</button>
        <button type="button" aria-label={`Move ${tab.label} later`} disabled={index === tabs.length - 1} onClick={() => move(index, 1)} className="rounded border px-2 disabled:opacity-40">↓</button>
      </div>)}
      <button type="button" onClick={save} className="rounded bg-primary px-3 py-1 text-primary-foreground">Save tabs</button>
      <button type="button" onClick={reset} className="ml-2 rounded border px-3 py-1">Reset defaults</button>
    </section>}
    <p role="status" className="text-xs">{notice}</p>
  </div>
}
