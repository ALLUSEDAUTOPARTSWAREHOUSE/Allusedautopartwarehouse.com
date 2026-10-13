import { createAgentUIStreamResponse } from "ai"
import { getAdminSession } from "@/lib/admin-auth"
import { adminAssistant } from "@/lib/admin-assistant"

export const maxDuration = 60

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 })
  }
  const body = await request.json().catch(() => null)
  const messages = body?.messages
  if (!Array.isArray(messages)) {
    return Response.json({ error: "Invalid request" }, { status: 400 })
  }

  return createAgentUIStreamResponse({
    agent: adminAssistant,
    uiMessages: messages.slice(-40),
  })
}
