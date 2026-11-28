'use client'

import { useId, useRef, useState } from 'react'

type ActivityAction = 'record_opened' | 'outcome_reported'
type WorkflowOutcome = 'confirmed' | 'unable' | 'follow_up' | 'in_progress' | 'closed'
type EventPayload = {
  eventId: string
  recordType: 'order' | 'quote'
  recordId: string
  action: ActivityAction
  outcome?: WorkflowOutcome
  note: string
}
type Feedback = {
  kind: 'idle' | 'pending' | 'success' | 'error'
  message?: string
  recordedAt?: string
}

const OUTCOMES: { value: WorkflowOutcome; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'unable', label: 'Unable to proceed' },
  { value: 'follow_up', label: 'Follow-up needed' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'closed', label: 'Closed' },
]

function EventFeedback({ feedback }: { feedback: Feedback }) {
  if (feedback.kind === 'idle') return null
  return (
    <p
      role={feedback.kind === 'error' ? 'alert' : 'status'}
      aria-live={feedback.kind === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`mt-2 text-xs leading-5 ${feedback.kind === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
    >
      {feedback.message}
      {feedback.recordedAt ? (
        <> Server time: <time dateTime={feedback.recordedAt}>{new Date(feedback.recordedAt).toLocaleString()}</time>.</>
      ) : null}
    </p>
  )
}

export function RecordWorkPanel({ recordType, recordId }: { recordType: 'order' | 'quote'; recordId: string }) {
  const descriptionId = useId()
  const [outcome, setOutcome] = useState<WorkflowOutcome>('confirmed')
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState<Record<ActivityAction, Feedback>>({
    record_opened: { kind: 'idle' },
    outcome_reported: { kind: 'idle' },
  })
  const wasOpen = useRef(false)
  const inFlight = useRef(new Set<ActivityAction>())
  const attempts = useRef<Partial<Record<ActivityAction, EventPayload>>>({})
  const outcomePending = feedback.outcome_reported.kind === 'pending'

  function updateFeedback(action: ActivityAction, next: Feedback) {
    setFeedback(current => ({ ...current, [action]: next }))
  }

  async function record(action: ActivityAction, reportedOutcome?: WorkflowOutcome, evidence = '') {
    if (inFlight.current.has(action)) return
    // Keep the exact request after an uncertain response. A retry must acknowledge
    // the original event, not insert another report with a fresh UUID.
    const previous = attempts.current[action]
    const sameInput = previous?.recordType === recordType
      && previous.recordId === recordId
      && previous.outcome === reportedOutcome
      && previous.note === evidence
    const payload: EventPayload = sameInput ? previous : {
      eventId: crypto.randomUUID(),
      recordType,
      recordId,
      action,
      ...(reportedOutcome ? { outcome: reportedOutcome } : {}),
      note: evidence,
    }
    attempts.current[action] = payload
    inFlight.current.add(action)
    updateFeedback(action, {
      kind: 'pending',
      message: action === 'record_opened' ? 'Recording this panel open…' : 'Recording your workflow outcome…',
    })

    try {
      const response = await fetch('/api/record-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        const detail = typeof data?.error === 'string' ? data.error.slice(0, 500) : 'The server could not record this event.'
        updateFeedback(action, {
          kind: 'error',
          message: `${action === 'record_opened' ? 'Open event' : 'Workflow outcome'} not confirmed. ${detail} Retry unchanged details to check the same event.`,
        })
        return
      }
      if (data?.ok !== true || data.eventId !== payload.eventId || data.sourceChanged !== false) {
        throw new Error('The response did not confirm this event.')
      }
      const recordedAt = typeof data.recordedAt === 'string' && Number.isFinite(Date.parse(data.recordedAt))
        ? data.recordedAt
        : undefined
      updateFeedback(action, {
        kind: 'success',
        message: action === 'record_opened'
          ? 'Record open logged. This is an observed open, not a reported outcome.'
          : `Workflow outcome recorded: ${OUTCOMES.find(option => option.value === reportedOutcome)?.label ?? reportedOutcome}. Source status unchanged.`,
        recordedAt,
      })
      delete attempts.current[action]
    } catch {
      updateFeedback(action, {
        kind: 'error',
        message: `${action === 'record_opened' ? 'Open event' : 'Workflow outcome'} confirmation was not received. The server may have saved it. Retry unchanged details to check the same event without duplicating it.`,
      })
    } finally {
      inFlight.current.delete(action)
    }
  }

  return (
    <details
      className="mt-4 rounded-lg border border-border bg-muted/20 p-3"
      onToggle={event => {
        const next = event.currentTarget.open
        if (next && !wasOpen.current) void record('record_opened')
        wasOpen.current = next
      }}
    >
      <summary className="cursor-pointer text-sm font-semibold">Open work record & report outcome</summary>
      <p id={descriptionId} className="mt-2 text-xs leading-5 text-muted-foreground">
        Opening this panel records your signed-in identity and the server time. A workflow outcome is your internal assessment;
        recording it does not change the saved order or lead status.
      </p>
      <EventFeedback feedback={feedback.record_opened} />
      {feedback.record_opened.kind === 'error' ? (
        <button
          type="button"
          className="mt-2 rounded border border-border px-3 py-1.5 text-xs font-medium"
          onClick={() => void record('record_opened')}
        >
          Retry open event
        </button>
      ) : null}
      <form
        aria-label="Record a workflow outcome"
        aria-describedby={descriptionId}
        aria-busy={outcomePending}
        className="mt-3 grid gap-2 sm:grid-cols-[12rem_1fr_auto]"
        onSubmit={event => {
          event.preventDefault()
          void record('outcome_reported', outcome, note)
        }}
      >
        <label className="text-xs">
          Workflow outcome
          <select
            name="outcome"
            value={outcome}
            disabled={outcomePending}
            className="mt-1 w-full rounded border border-border bg-background p-2 disabled:opacity-50"
            required
            onChange={event => {
              setOutcome(event.target.value as WorkflowOutcome)
              updateFeedback('outcome_reported', { kind: 'idle' })
            }}
          >
            {OUTCOMES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="text-xs">
          Evidence or next step
          <input
            name="note"
            value={note}
            maxLength={1000}
            disabled={outcomePending}
            className="mt-1 w-full rounded border border-border bg-background p-2 disabled:opacity-50"
            placeholder="Record the observed result or next step"
            onChange={event => {
              setNote(event.target.value)
              updateFeedback('outcome_reported', { kind: 'idle' })
            }}
          />
        </label>
        <button
          type="submit"
          disabled={outcomePending}
          className="self-end rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {outcomePending ? 'Recording…' : feedback.outcome_reported.kind === 'error' ? 'Retry outcome' : 'Record outcome'}
        </button>
      </form>
      <EventFeedback feedback={feedback.outcome_reported} />
    </details>
  )
}
