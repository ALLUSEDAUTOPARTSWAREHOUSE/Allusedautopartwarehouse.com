export const QUOTE_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const
export const ORDER_STATUSES = [
  'pending',
  'reserved_pending_fitment',
  'confirmed',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
] as const

export type QuoteStatus = (typeof QUOTE_STATUSES)[number]
export type OrderStatus = (typeof ORDER_STATUSES)[number]
