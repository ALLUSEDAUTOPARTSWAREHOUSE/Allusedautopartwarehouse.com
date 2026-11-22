import "server-only"

/**
 * Admin AI uses the existing AI SDK model routing through AI Gateway.
 * Set AUAPW_ADMIN_AI_MODEL to select another gateway model without changing
 * application code. The default is OpenAI GPT-4o mini for cost-conscious
 * operations and support tasks.
 */
export const DEFAULT_ADMIN_AI_MODEL = "openai/gpt-4o-mini"

const MODEL_ID_PATTERN = /^[a-z0-9][a-z0-9._/-]{0,100}$/i

export function getAdminAssistantModel(): string {
  const configured = process.env.AUAPW_ADMIN_AI_MODEL?.trim()
  if (configured && MODEL_ID_PATTERN.test(configured)) return configured
  return DEFAULT_ADMIN_AI_MODEL
}
