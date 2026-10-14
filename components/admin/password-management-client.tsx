"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, ShieldCheck, Users, Loader2, RefreshCw } from "lucide-react"

type StaffPasswordState = {
  id: string; name: string; email: string; role: string; status: string
  hasPassword: boolean; passwordUpdatedAt: string | null
}

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
const buttonClass = "rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"

export function PasswordManagementClient() {
  const router = useRouter()
  const [staff, setStaff] = useState<StaffPasswordState[]>([])
  const [currentPassword, setCurrentPassword] = useState("")
  const [newAdminPassword, setNewAdminPassword] = useState("")
  const [staffPasswords, setStaffPasswords] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/security/passwords", { credentials: "include", cache: "no-store" })
      if (response.status === 401) { router.push("/admin/login"); return }
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load team members.")
      setStaff(data.staff || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load team members.")
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  async function submit(action: "change-admin" | "set-staff", staffId?: string) {
    setError(""); setNotice("")
    const newPassword = action === "change-admin" ? newAdminPassword : (staffPasswords[staffId || ""] || "")
    if (!currentPassword || !newPassword) { setError("Enter the current admin password and the new password."); return }
    setBusy(true)
    try {
      const response = await fetch("/api/admin/security/passwords", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, currentPassword, newPassword, staffId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Password update failed.")
      setCurrentPassword("")
      if (action === "change-admin") {
        setNewAdminPassword("")
        setNotice(data.message || "Admin password changed.")
        router.push("/admin/login")
        router.refresh()
        return
      }
      setStaffPasswords(current => ({ ...current, [staffId || ""]: "" }))
      setNotice(data.message || "Team member password saved.")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Password update failed.")
    } finally { setBusy(false) }
  }

  return <div className="mx-auto flex max-w-5xl flex-col gap-6">
    <header>
      <div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-primary" aria-hidden="true" /><h1 className="text-2xl font-bold">Secure password management</h1></div>
      <p className="mt-2 text-sm text-muted-foreground">Change the administrator password and set or reset team member credential passwords. Passwords are stored only as salted scrypt hashes; plaintext passwords are never returned by the server.</p>
    </header>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="rounded-lg border border-border bg-card p-3 text-sm">{notice}</p>}

    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" aria-hidden="true" /><h2 className="text-lg font-semibold">Administrator password</h2></div>
      <p className="mb-4 text-sm text-muted-foreground">Email: Info@Allusedautopartswarehouse.com. You must enter your current admin password. After saving, all existing admin sessions are invalidated and you must sign in again.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Current admin password<input type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className={inputClass+" mt-1"} /></label>
        <label className="text-sm font-medium">New admin password<input type="password" autoComplete="new-password" value={newAdminPassword} onChange={e=>setNewAdminPassword(e.target.value)} minLength={12} maxLength={128} className={inputClass+" mt-1"} /></label>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Use 12–128 characters, including uppercase, lowercase, and a number. Save the new password securely; it cannot be displayed again.</p>
      <button type="button" disabled={busy} onClick={()=>void submit("change-admin")} className={buttonClass+" mt-4"}>{busy ? "Saving…" : "Change admin password"}</button>
    </section>

    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-2 flex items-center gap-2"><Users className="h-5 w-5 text-primary" aria-hidden="true" /><h2 className="text-lg font-semibold">Team member passwords</h2></div>
      <p className="mb-4 text-sm text-muted-foreground">Set or reset a credential for a team directory member. For each reset, confirm the current admin password. This does not email or display the new password to anyone.</p>
      <div className="mb-4 flex justify-end"><button type="button" onClick={()=>void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><RefreshCw className="h-4 w-4" aria-hidden="true" />Refresh list</button></div>
      {loading ? <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading team members…</p> :
      staff.length === 0 ? <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">No team members found. Add them in Team Directory first.</p> :
      <div className="space-y-3">{staff.map(member=><div key={member.id} className="rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{member.name}</p><p className="text-sm text-muted-foreground">{member.email}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{member.role.replaceAll("_"," ")} · {member.status}</p></div><span className={"rounded-full px-2.5 py-1 text-xs "+(member.hasPassword?"bg-green-500/10 text-green-700 dark:text-green-300":"bg-muted text-muted-foreground")}>{member.hasPassword?"Password set":"No password set"}</span></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="text-sm font-medium">New password for {member.name}<input type="password" autoComplete="new-password" minLength={12} maxLength={128} value={staffPasswords[member.id]||""} onChange={e=>setStaffPasswords(current=>({...current,[member.id]:e.target.value}))} className={inputClass+" mt-1"} placeholder="12+ characters, upper/lowercase and number" /></label>
          <button type="button" disabled={busy||!staffPasswords[member.id]} onClick={()=>void submit("set-staff",member.id)} className={buttonClass}>{busy?"Saving…":"Set / reset password"}</button>
        </div>
        {member.passwordUpdatedAt && <p className="mt-2 text-xs text-muted-foreground">Last updated: {new Date(member.passwordUpdatedAt).toLocaleString()}</p>}
      </div>)}</div>}
    </section>
  </div>
}
