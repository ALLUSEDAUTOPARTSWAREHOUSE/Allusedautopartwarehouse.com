"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error("[AUAPW Error Page]", error)
  }, [error])

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 bg-background"
      role="alert"
      aria-labelledby="error-heading"
    >
      <div className="text-center max-w-[460px]">
        <div className="glass-card rounded-lg px-8 py-10">
          <div className="metal-line mb-6" aria-hidden="true" />

          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-5 h-5 text-red-400" aria-hidden="true" />
          </div>

          <h1
            id="error-heading"
            className="font-serif text-2xl font-bold text-foreground mb-3"
          >
            Something Went Wrong
          </h1>

          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            An unexpected error occurred. You can try again or return home.
          </p>

          {error.digest && (
            <p className="text-[10px] text-muted-foreground/50 font-mono mb-6">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3 justify-center flex-wrap mt-6">
            <button
              type="button"
              onClick={reset}
              className="auapw-btn auapw-btn-blue inline-flex items-center gap-2 px-5 py-2.5 text-[0.7rem] font-bold tracking-[0.18em] uppercase rounded-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Try Again
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[0.7rem] font-bold tracking-[0.18em] uppercase border border-border/60 text-muted-foreground rounded-sm hover:border-foreground/50 hover:text-foreground transition-all"
            >
              <Home className="w-3.5 h-3.5" aria-hidden="true" />
              Go Home
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
