'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'

export interface User {
  id: string
  email: string
  name: string
  createdAt: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Browser state reflects the server session, never a locally fabricated identity. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending, refetch } = authClient.useSession()
  useEffect(() => {
    // Discard identities created by the retired mock login implementation.
    localStorage.removeItem('auth-user')
  }, [])
  const user = data?.user ? {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    createdAt: new Date(data.user.createdAt).getTime(),
  } : null

  async function login(email: string, password: string) {
    const result = await authClient.signIn.email({ email, password })
    if (result.error) throw new Error(result.error.message || 'Sign in failed')
    await refetch()
  }
  async function signup(email: string, password: string, name: string) {
    const result = await authClient.signUp.email({ email, password, name })
    if (result.error) throw new Error(result.error.message || 'Account creation failed')
    await refetch()
  }
  async function logout() {
    const result = await authClient.signOut()
    if (result.error) throw new Error(result.error.message || 'Sign out failed')
    await refetch()
  }

  return <AuthContext.Provider value={{ user, isLoading: isPending, login, signup, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
