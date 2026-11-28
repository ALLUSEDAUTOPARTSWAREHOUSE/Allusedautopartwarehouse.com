import { createAgentUIStreamResponse } from 'ai'
import { getStaffSession } from '@/lib/staff-auth'
import { createStaffAssistant, normalizeStaffMessages, StaffAssistantError } from '@/lib/staff-assistant'

export const runtime = 'nodejs'
export const maxDuration = 60
const headers = { 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' }
const MAX_BODY_BYTES = 64 * 1024

export async function POST(request: Request) {
  const staff = await getStaffSession()
  if (!staff) return Response.json({ error: 'Staff sign-in is required.' }, { status: 401, headers })
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Invalid origin.' }, { status: 403, headers })
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return Response.json({ error: 'Send a JSON conversation.' }, { status: 415, headers })
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) return Response.json({ error: 'Conversation is too large.' }, { status: 413, headers })
  try {
    const reader = request.body?.getReader()
    let raw = '', bytes = 0
    if (reader) {
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        bytes += value.byteLength
        if (bytes > MAX_BODY_BYTES) { await reader.cancel(); return Response.json({ error: 'Conversation is too large.' }, { status: 413, headers }) }
        raw += decoder.decode(value, { stream: true })
      }
      raw += decoder.decode()
    }
    let body: unknown
    try { body = JSON.parse(raw) } catch { return Response.json({ error: 'Invalid JSON conversation.' }, { status: 400, headers }) }
    const uiMessages = normalizeStaffMessages(body && typeof body === 'object' && 'messages' in body ? body.messages : null)
    return await createAgentUIStreamResponse({
      agent: createStaffAssistant(staff), uiMessages, headers, abortSignal: request.signal, timeout: 45_000,
      onError: () => 'The staff assistant is unavailable. No business action was executed. Please try again.',
    })
  } catch (error) {
    if (error instanceof StaffAssistantError) return Response.json({ error: error.message }, { status: error.status, headers })
    return Response.json({ error: 'The staff assistant is unavailable. No business action was executed.' }, { status: 503, headers })
  }
}
