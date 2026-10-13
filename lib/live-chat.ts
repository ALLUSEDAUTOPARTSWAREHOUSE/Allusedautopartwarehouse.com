import { randomUUID } from "crypto"
import { pool } from "@/lib/db"

export const CHAT_GUEST_COOKIE = "auapw_chat_guest"
export const CHAT_MAX_BODY = 2000

export type ChatSender = "customer" | "admin"
export type ChatStatus = "open" | "closed"

export interface ChatMessage {
  id: string
  conversationId: string
  sender: ChatSender
  body: string
  createdAt: string
}

export interface ChatConversation {
  id: string
  guestId: string
  customerName: string | null
  customerEmail: string | null
  pageUrl: string | null
  status: ChatStatus
  unreadForAdmin: boolean
  unreadForCustomer: boolean
  lastMessageAt: string
  createdAt: string
  lastMessage?: string | null
}

type Row = Record<string, unknown>

const toIso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v))

function mapConversation(r: Row): ChatConversation {
  return {
    id: String(r.id),
    guestId: String(r.guest_id),
    customerName: (r.customer_name as string) ?? null,
    customerEmail: (r.customer_email as string) ?? null,
    pageUrl: (r.page_url as string) ?? null,
    status: r.status === "closed" ? "closed" : "open",
    unreadForAdmin: Boolean(r.unread_for_admin),
    unreadForCustomer: Boolean(r.unread_for_customer),
    lastMessageAt: toIso(r.last_message_at),
    createdAt: toIso(r.created_at),
    lastMessage: (r.last_message as string) ?? null,
  }
}

function mapMessage(r: Row): ChatMessage {
  return {
    id: String(r.id),
    conversationId: String(r.conversation_id),
    sender: r.sender === "admin" ? "admin" : "customer",
    body: String(r.body),
    createdAt: toIso(r.created_at),
  }
}

export function cleanBody(raw: unknown): string | null {
  const s = String(raw ?? "").trim().slice(0, CHAT_MAX_BODY)
  return s ? s : null
}

export function cleanOptional(raw: unknown, max: number): string | null {
  const s = String(raw ?? "").trim().slice(0, max)
  return s ? s : null
}

export async function getOpenConversationForGuest(guestId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM chat_conversations WHERE guest_id = $1 AND status = 'open'
     ORDER BY last_message_at DESC LIMIT 1`,
    [guestId],
  )
  return rows[0] ? mapConversation(rows[0]) : null
}

export async function getConversation(id: string) {
  const { rows } = await pool.query(`SELECT * FROM chat_conversations WHERE id = $1`, [id])
  return rows[0] ? mapConversation(rows[0]) : null
}

export async function listMessages(conversationId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 500`,
    [conversationId],
  )
  return rows.map(mapMessage)
}

/** Appends a customer message, creating an open conversation for the guest when none exists. */
export async function addCustomerMessage(input: {
  guestId: string
  body: string
  name?: string | null
  email?: string | null
  pageUrl?: string | null
}) {
  let conversation = await getOpenConversationForGuest(input.guestId)
  const isNew = !conversation

  if (!conversation) {
    const id = randomUUID()
    const { rows } = await pool.query(
      `INSERT INTO chat_conversations (id, guest_id, customer_name, customer_email, page_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, input.guestId, input.name ?? null, input.email ?? null, input.pageUrl ?? null],
    )
    conversation = mapConversation(rows[0])
  } else if (input.name || input.email) {
    await pool.query(
      `UPDATE chat_conversations
         SET customer_name = COALESCE($2, customer_name), customer_email = COALESCE($3, customer_email)
       WHERE id = $1`,
      [conversation.id, input.name ?? null, input.email ?? null],
    )
  }

  await pool.query(
    `INSERT INTO chat_messages (id, conversation_id, sender, body) VALUES ($1, $2, 'customer', $3)`,
    [randomUUID(), conversation.id, input.body],
  )
  await pool.query(
    `UPDATE chat_conversations SET last_message_at = now(), unread_for_admin = true WHERE id = $1`,
    [conversation.id],
  )

  return { conversationId: conversation.id, isNew }
}

export async function addAdminReply(conversationId: string, body: string) {
  const conversation = await getConversation(conversationId)
  if (!conversation) return false
  await pool.query(
    `INSERT INTO chat_messages (id, conversation_id, sender, body) VALUES ($1, $2, 'admin', $3)`,
    [randomUUID(), conversationId, body],
  )
  await pool.query(
    `UPDATE chat_conversations
       SET last_message_at = now(), unread_for_customer = true, unread_for_admin = false, status = 'open'
     WHERE id = $1`,
    [conversationId],
  )
  return true
}

export async function addBotReply(conversationId: string, body: string) {
  await pool.query(
    `INSERT INTO chat_messages (id, conversation_id, sender, body, is_bot) VALUES ($1, $2, 'admin', $3, true)`,
    [randomUUID(), conversationId, body],
  )
  await pool.query(
    `UPDATE chat_conversations SET last_message_at = now(), unread_for_customer = true WHERE id = $1`,
    [conversationId],
  )
}

/** True when a staff member has replied recently, so the AI bot stays out of the way. */
export async function hasRecentHumanReply(conversationId: string, minutes = 30) {
  const { rows } = await pool.query(
    `SELECT 1 FROM chat_messages
     WHERE conversation_id = $1 AND sender = 'admin' AND is_bot = false
       AND created_at > now() - ($2::int * interval '1 minute')
     LIMIT 1`,
    [conversationId, minutes],
  )
  return rows.length > 0
}

export async function markReadBy(conversationId: string, who: ChatSender) {
  const column = who === "admin" ? "unread_for_admin" : "unread_for_customer"
  await pool.query(`UPDATE chat_conversations SET ${column} = false WHERE id = $1`, [conversationId])
}

export async function setConversationStatus(conversationId: string, status: ChatStatus) {
  await pool.query(`UPDATE chat_conversations SET status = $2 WHERE id = $1`, [conversationId, status])
}

export async function listConversations(status: ChatStatus | "all" = "open", limit = 100) {
  const { rows } = await pool.query(
    `SELECT c.*, (
        SELECT m.body FROM chat_messages m WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC LIMIT 1
      ) AS last_message
     FROM chat_conversations c
     WHERE ($1 = 'all' OR c.status = $1)
     ORDER BY c.last_message_at DESC
     LIMIT $2`,
    [status, Math.min(Math.max(limit, 1), 200)],
  )
  return rows.map(mapConversation)
}

export async function countUnreadForAdmin() {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM chat_conversations WHERE status = 'open' AND unread_for_admin = true`,
  )
  return Number(rows[0]?.n ?? 0)
}
