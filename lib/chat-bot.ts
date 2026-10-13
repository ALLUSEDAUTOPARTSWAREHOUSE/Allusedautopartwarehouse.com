import { generateText, isStepCount, tool, type ModelMessage } from "ai"
import { z } from "zod"
import { searchCatalog } from "@/lib/ai-catalog"
import { PHONE_DISPLAY, SHIPPING, USED_WARRANTY } from "@/lib/site-policy"
import type { ChatMessage } from "@/lib/live-chat"

const INSTRUCTIONS = `You are the friendly parts specialist in the live chat of All Used Auto Parts Warehouse (AUAPW), a seller of used engines and transmissions.
Help customers find the right used engine or transmission. Ask for year, make, model (and engine size if relevant) when missing.
Use the searchParts tool to look up real parts and prices. Never invent prices, stock, or part numbers.
When a part has a price, share the price and its page link. When the price is null, say it is "call for price" and share the link so they can request a quote or reserve it.
Policies: ${USED_WARRANTY} warranty on used parts. Shipping: ${SHIPPING.label}. Phone: ${PHONE_DISPLAY}.
If they want to talk to a person, ask for their email or phone and tell them a specialist will follow up shortly, or they can call ${PHONE_DISPLAY}.
Keep replies short (2-5 sentences), plain text, no markdown tables. Links should be full paths like /brand/... exactly as returned by the tool.`

const tools = {
  searchParts: tool({
    description: "Search the used engine and transmission catalog by make, model, year and part type.",
    inputSchema: z.object({
      make: z.string().describe("Vehicle make, e.g. Ford, Chevy, Toyota"),
      model: z.string().optional().describe("Vehicle model, e.g. F-150, Camry"),
      year: z.string().optional().describe("4-digit year"),
      category: z.enum(["engine", "transmission"]).optional(),
      query: z.string().optional().describe("Extra keywords like engine size, e.g. 5.0L"),
    }),
    execute: async (input) =>
      searchCatalog({ ...input, limit: 5 }).map((h) => ({
        name: h.name,
        year: h.year,
        model: h.model,
        category: h.category,
        price: h.price,
        url: h.url,
      })),
  }),
}

export async function generateChatReply(history: ChatMessage[]): Promise<string | null> {
  const messages: ModelMessage[] = history.slice(-20).map((m) => ({
    role: m.sender === "customer" ? "user" : "assistant",
    content: m.body,
  }))
  const { text } = await generateText({
    model: "google/gemini-2.5-flash-lite",
    instructions: INSTRUCTIONS,
    messages,
    tools,
    stopWhen: isStepCount(4),
    abortSignal: AbortSignal.timeout(25_000),
  })
  const reply = text.trim()
  return reply ? reply.slice(0, 2000) : null
}
