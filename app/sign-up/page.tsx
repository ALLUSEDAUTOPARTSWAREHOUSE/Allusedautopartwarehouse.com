export const metadata = { title: 'Accept invitation | AUAPW', robots: { index: false, follow: false }, referrer: 'no-referrer' as const }

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'

function safeRedirect(value: string | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes(String.fromCharCode(92))) return '/'
  const path = value.split(/[?#]/, 1)[0]
  if (path.split('/').some((part) => part === '.' || part === '..')) return '/'
  return value
}

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ redirectTo?: string; invite?: string }> }) {
  const params = await searchParams
  const target = safeRedirect(params.redirectTo)
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect(target)
  if (!params.invite || !/^[A-Za-z0-9_-]{43}$/.test(params.invite)) {
    return <main className="mx-auto max-w-lg space-y-4 p-8"><h1 className="text-2xl font-bold">Invitation required</h1><p>New accounts are invite-only. Ask the store administrator to email you an invitation. Existing customers can still sign in.</p><a href="/sign-in" className="underline">Sign in to an existing account</a></main>
  }
  return <AuthForm mode="sign-up" redirectTo={target} inviteToken={params.invite} />
}
