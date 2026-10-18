"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  context?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ errorInfo: info.componentStack ?? null })
    console.error(`[ErrorBoundary${this.props.context ? ` – ${this.props.context}` : ""}]`, error, info)
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, error: null, errorInfo: null })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center justify-center gap-4 p-8 rounded-lg border border-red-500/30 bg-red-950/20 text-center min-h-[200px]"
        >
          <AlertTriangle className="w-8 h-8 text-red-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Something went wrong</p>
            <p className="text-xs text-muted-foreground max-w-[360px]">
              {this.state.error?.message ?? "An unexpected error occurred in this section."}
            </p>
            {this.props.context && (
              <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-wider">
                Context: {this.props.context}
              </p>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-border/60 text-muted-foreground rounded hover:text-foreground hover:border-foreground/50 transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Lightweight inline error notice — not a boundary, used for API/async errors
export function ErrorNotice({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-start gap-3 px-4 py-3 rounded-lg border border-red-500/25 bg-red-950/15"
    >
      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground font-medium">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  )
}
