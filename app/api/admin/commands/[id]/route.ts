import { revalidatePath } from 'next/cache'
import { getAdminSession } from '@/lib/admin-auth'
import { AdminCommandError, decideAdminCommand, getAdminCommandStatus } from '@/lib/admin-commands'
import { commandDecisionSchema, commandIdSchema } from '@/lib/admin-command-policy'

export const runtime = 'nodejs'
type Context = { params: Promise<{ id: string }> }
const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
function failure(error: unknown) {
  if (error instanceof AdminCommandError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers })
  return Response.json({ error: 'The command could not be processed. Refresh its saved status before trying again.' }, { status: 503, headers })
}
export async function GET(_request: Request, context: Context) {
  if (!await getAdminSession()) return Response.json({ error: 'Unauthorized' }, { status: 401, headers })
  const { id } = await context.params
  if (!commandIdSchema.safeParse(id).success) return Response.json({ error: 'Invalid command ID.' }, { status: 400, headers })
  try { return Response.json(await getAdminCommandStatus(id), { headers }) } catch (error) { return failure(error) }
}
export async function POST(request: Request, context: Context) {
  if (!await getAdminSession()) return Response.json({ error: 'Unauthorized' }, { status: 401, headers })
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Invalid origin' }, { status: 403, headers })
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return Response.json({ error: 'Send a JSON approval decision.' }, { status: 415, headers })
  const { id } = await context.params
  if (!commandIdSchema.safeParse(id).success) return Response.json({ error: 'Invalid command ID.' }, { status: 400, headers })
  if (Number(request.headers.get('content-length')) > 1024) return Response.json({ error: 'Approval request is too large.' }, { status: 413, headers })
  const reader = request.body?.getReader()
  let raw = '', bytes = 0
  if (reader) {
    const decoder = new TextDecoder()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > 1024) { await reader.cancel(); return Response.json({ error: 'Approval request is too large.' }, { status: 413, headers }) }
      raw += decoder.decode(value, { stream: true })
    }
    raw += decoder.decode()
  }
  let input: unknown
  try { input = JSON.parse(raw) } catch { return Response.json({ error: 'Invalid approval decision.' }, { status: 400, headers }) }
  const decision = commandDecisionSchema.safeParse(input)
  if (!decision.success) return Response.json({ error: 'Only an approve or deny decision is accepted; execution arguments come from the stored preview.' }, { status: 400, headers })
  try {
    const command = await decideAdminCommand(id, decision.data.decision)
    if (command.status === 'completed') revalidatePath('/admin/team')
    if (command.status === 'stale' || command.status === 'expired') return Response.json({ error: String(command.result?.message || 'Prepare a fresh preview.'), command }, { status: 409, headers })
    return Response.json(command, { headers })
  } catch (error) { return failure(error) }
}
