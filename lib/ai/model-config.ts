import "server-only"

/**
 * Admin AI uses the AI SDK's existing model routing through AI Gateway.
 * Select an OpenAI or Anthropic model with AUAPW_ADMIN_AI_MODEL without
 * changing application code. The default remains OpenAI GPT-4o mini.
 */
export const DEFAULT_ADMIN_AI_MODEL = "openai/gpt-4o-mini"

/** Suggested provider/model choices supported by the existing gateway route. */
export const ADMIN_AI_MODEL_PRESETS = [
  { provider: "OpenAI", label: "GPT-4o mini", model: "openai/gpt-4o-mini" },
  { provider: "Anthropic", label: "Claude Sonnet 4.5", model: "anthropic/claude-sonnet-4.5" },
  { provider: "Anthropic", label: "Claude Haiku 4.5", model: "anthropic/claude-haiku-4.5" },
] as const

const MODEL_ID_PATTERN = /^[a-z0-9][a-z0-9._/-]{0,100}$/i

export function getAdminAssistantModel(): string {
  const configured = process.env.AUAPW_ADMIN_AI_MODEL?.trim()
  if (configured && MODEL_ID_PATTERN.test(configured)) return configured
  return DEFAULT_ADMIN_AI_MODEL
}
