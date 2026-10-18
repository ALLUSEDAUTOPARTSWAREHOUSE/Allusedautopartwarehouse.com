'use client'

import { useEffect, useState } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { MobileThemeFab } from '@/components/mobile-theme-fab'
import { IntercomProvider } from '@/components/intercom-provider'
import { LiveChatWidget } from '@/components/chat/live-chat-widget'

export function ClientWidgets() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) return null

  return (
    <ErrorBoundary context="widgets">
      <MobileThemeFab />
      <IntercomProvider />
      <LiveChatWidget />
    </ErrorBoundary>
  )
}
