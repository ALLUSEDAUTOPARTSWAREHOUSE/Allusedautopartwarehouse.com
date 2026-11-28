import { getActivityActor, getRecordActivityReport, recordActivity } from '@/lib/record-activity'
import { ZodError } from 'zod'

export const dynamic = 'force-dynamic'
const noStore = { 'Cache-Control':'no-store' }
function failure(error: unknown) {
  const status = error instanceof ZodError ? 400 : Number((error as {status?:number})?.status) || 503
  return Response.json({ error: status < 500 ? (error instanceof Error ? error.message : 'Invalid request.') : 'Activity storage is unavailable. Apply the record-activity migration and check the database connection.' }, { status, headers:noStore })
}
export async function GET() {
  try { return Response.json(await getRecordActivityReport(), {headers:noStore}) } catch(error) { return failure(error) }
}
export async function POST(request: Request) {
  try {
    const actor = await getActivityActor()
    if (!actor) return Response.json({error:'Unauthorized'}, {status:401,headers:noStore})
    if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({error:'Invalid origin'}, {status:403,headers:noStore})
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return Response.json({error:'Send a JSON activity event'}, {status:415,headers:noStore})
    if (Number(request.headers.get('content-length')) > 8000) return Response.json({error:'Request too large'}, {status:413,headers:noStore})
    const reader = request.body?.getReader()
    let text = '', bytes = 0
    if (reader) {
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        bytes += value.byteLength
        if (bytes > 8000) { await reader.cancel(); return Response.json({error:'Request too large'}, {status:413,headers:noStore}) }
        text += decoder.decode(value, {stream:true})
      }
      text += decoder.decode()
    }
    let input: unknown
    try { input = JSON.parse(text) } catch { return Response.json({error:'Invalid request'}, {status:400,headers:noStore}) }
    return Response.json(await recordActivity(actor,input), {headers:noStore})
  } catch(error) { return failure(error) }
}
