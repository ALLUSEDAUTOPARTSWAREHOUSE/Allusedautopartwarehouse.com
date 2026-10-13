'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export function AuthForm({ mode, redirectTo = '/' }: { mode: 'sign-in' | 'sign-up'; redirectTo?: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'
  const target = redirectTo.startsWith('/') && !redirectTo.startsWith('//') && !redirectTo.includes(String.fromCharCode(92)) && !redirectTo.split(/[?#]/, 1)[0].split('/').some((part) => part === '.' || part === '..') ? redirectTo : '/'
  const switchHref = `${isSignUp ? '/sign-in' : '/sign-up'}?redirectTo=${encodeURIComponent(target)}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message ?? 'Unable to authenticate. Please try again.')
        return
      }
      router.push(target)
      router.refresh()
    } catch {
      setError('Unable to reach the sign-in service. Please try again.')
    } finally { setLoading(false) }

  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-xl lg:grid-cols-2">
        <section className="flex flex-col justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-8 text-white sm:p-12" aria-label="Customer welcome">
          <Link href="/" className="text-sm font-semibold text-purple-200">ALL USED AUTO PARTS WAREHOUSE</Link>
          <h2 className="mt-8 text-4xl font-bold">Your next repair starts here.</h2>
          <p className="mt-5 text-purple-100">Create your customer account or sign in to continue shopping for automotive parts.</p>
          <p className="mt-8 text-xs text-purple-200">Customer accounts do not grant administrator access. Guest orders require separate ownership verification.</p>
        </section>
      <Card className="w-full rounded-none border-0 p-6 sm:p-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp
              ? 'Sign up to get started'
              : 'Sign in to your account to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
            <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} className="flex items-center gap-2 self-start text-xs text-muted-foreground">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{showPassword ? 'Hide password' : 'Show password'}</button>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? 'Please wait...'
              : isSignUp
                ? 'Create account'
                : 'Sign in'}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            href={switchHref}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </Card>
      </div>
    </main>
  )
}
