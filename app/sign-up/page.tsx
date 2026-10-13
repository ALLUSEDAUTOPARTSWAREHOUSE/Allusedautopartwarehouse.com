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

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ redirectTo?: string }> }) {
  const params = await searchParams
  const target = safeRedirect(params.redirectTo)
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect(target)
  return <AuthForm mode="sign-up" redirectTo={target} />
}
