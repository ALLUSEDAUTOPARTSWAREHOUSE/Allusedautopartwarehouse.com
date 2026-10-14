'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Headset,
  Code2,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type StaffRole = 'sales_agent' | 'support_team' | 'developer_team'

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string | null
  role: StaffRole
  department: string | null
  title: string | null
  status: string
  notes: string | null
}

const ROLE_META: Record<StaffRole, { label: string; icon: typeof Users; color: string }> = {
  sales_agent: { label: 'Sales Agents', icon: Users, color: 'text-blue-400' },
  support_team: { label: 'Support Team', icon: Headset, color: 'text-emerald-400' },
  developer_team: { label: 'Developer Team', icon: Code2, color: 'text-purple-400' },
}

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  role: 'sales_agent' as StaffRole,
  department: '',
  title: '',
  notes: '',
}

export function TeamDirectoryClient() {
  const router = useRouter()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<StaffRole | 'all'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [loginPassword, setLoginPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadStaff = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/admin/staff', { credentials: 'include' })
      if (res.status === 401) {
        router.push('/admin/login')
        return
      }
      const data = await res.json()
      setStaff(data.staff ?? [])
    } catch {
      setError('Failed to load team directory.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const openCreate = (role?: StaffRole) => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, role: role ?? 'sales_agent' })
    setLoginPassword('')
    setError(null)
    setDialogOpen(true)
  }

  const openEdit = (member: StaffMember) => {
    setEditingId(member.id)
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone ?? '',
      role: member.role,
      department: member.department ?? '',
      title: member.title ?? '',
      notes: member.notes ?? '',
    })
    setLoginPassword('')
    setError(null)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.email) {
      setError('Name and email are required.')
      return
    }
    if (loginPassword && loginPassword.length < 12) {
      setError('Login password must be at least 12 characters.')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const url = editingId ? `/api/admin/staff/${editingId}` : '/api/admin/staff'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Failed to save staff member.')
        return
      }
      const staffId = editingId ?? data.staff?.id
      if (loginPassword && staffId) {
        const credentialRes = await fetch('/api/admin/staff/' + encodeURIComponent(staffId) + '/credentials', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ password: loginPassword }),
        })
        const credentialData = await credentialRes.json().catch(() => ({}))
        if (!credentialRes.ok) {
          setError(credentialData.error ?? 'Staff details saved, but login access could not be enabled. Try saving the password again.')
          await loadStaff()
          return
        }
      }
      setDialogOpen(false)
      setLoginPassword('')
      await loadStaff()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this team member from the directory?')) return
    try {
      await fetch(`/api/admin/staff/${id}`, { method: 'DELETE', credentials: 'include' })
      await loadStaff()
    } catch {
      setError('Failed to remove staff member.')
    }
  }

  const toggleStatus = async (member: StaffMember) => {
    const status = member.status === 'active' ? 'inactive' : 'active'
    await fetch(`/api/admin/staff/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    })
    await loadStaff()
  }

  const filtered = activeTab === 'all' ? staff : staff.filter((s) => s.role === activeTab)
  const counts = {
    sales_agent: staff.filter((s) => s.role === 'sales_agent').length,
    support_team: staff.filter((s) => s.role === 'support_team').length,
    developer_team: staff.filter((s) => s.role === 'developer_team').length,
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Directory</h1>
          <p className="text-sm text-muted-foreground">
            Manage sales agents, support team, and developer team members
          </p>
        </div>
        <Button onClick={() => openCreate()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Team Member
        </Button>
      </div>

      <section className="mb-5 rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold text-foreground">Sales, support &amp; email routing</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Active Sales Agent and Support Team members are included in new quote, order and reservation email alerts. When an order or quote is assigned from Sales &amp; Support, the selected owner also receives an assignment email. Developer Team members are kept out of customer-work alerts.
          Adding someone here creates a directory contact, not a separate login account or invitation.
        </p>
        <a href="/admin/settings" className="mt-2 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline">
          Check email sender and system health settings →
        </a>
      </section>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Role tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            activeTab === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border hover:border-primary/50'
          }`}
        >
          All ({staff.length})
        </button>
        {(Object.keys(ROLE_META) as StaffRole[]).map((role) => {
          const meta = ROLE_META[role]
          const Icon = meta.icon
          return (
            <button
              key={role}
              onClick={() => setActiveTab(role)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                activeTab === role
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:border-primary/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {meta.label} ({counts[role]})
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading team directory…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">
          No team members yet. Click &quot;Add Team Member&quot; to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member) => {
            const meta = ROLE_META[member.role]
            const Icon = meta.icon
            return (
              <div
                key={member.id}
                className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{member.name}</p>
                    {member.title && (
                      <p className="text-xs text-muted-foreground">{member.title}</p>
                    )}
                  </div>
                  <Badge
                    variant={member.status === 'active' ? 'default' : 'secondary'}
                    className="cursor-pointer shrink-0"
                    onClick={() => toggleStatus(member)}
                  >
                    {member.status}
                  </Badge>
                </div>

                <div className={`flex items-center gap-2 text-sm ${meta.color}`}>
                  <Icon className="w-4 h-4" />
                  {meta.label.replace(/s$/, '')}
                  {member.department ? ` · ${member.department}` : ''}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      {member.phone}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-auto pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() => openEdit(member)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(member.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Select
              value={form.role}
              onValueChange={(value: StaffRole) => setForm({ ...form, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales_agent">Sales Agent</SelectItem>
                <SelectItem value="support_team">Support Team</SelectItem>
                <SelectItem value="developer_team">Developer Team</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Title (optional, e.g. Senior Sales Agent)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="Department (optional)"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
            <Textarea
              placeholder="Notes (optional)"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <label className="mb-1 block text-sm font-medium">Portal login password <span className="font-normal text-muted-foreground">(optional)</span></label>
              <Input type="password" autoComplete="new-password" minLength={12} maxLength={256} placeholder="At least 12 characters to enable or reset login" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Set this when adding a member to enable their login immediately, or enter a new password when editing to reset access. Leave blank to keep existing login credentials unchanged.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
