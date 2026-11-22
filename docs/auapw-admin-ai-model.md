# AUAPW admin AI model configuration

The admin operations agent supports OpenAI and Anthropic Claude model IDs through
the repository's existing AI SDK model-routing integration. The default remains
`openai/gpt-4o-mini`; switch providers without changing application code.

## Supported model choices

Set the server-side environment variable `AUAPW_ADMIN_AI_MODEL` to one of these
model IDs:

| Provider | Model | Model ID |
| --- | --- | --- |
| OpenAI | GPT-4o mini (default) | `openai/gpt-4o-mini` |
| Anthropic | Claude Sonnet 4.5 | `anthropic/claude-sonnet-4.5` |
| Anthropic | Claude Haiku 4.5 | `anthropic/claude-haiku-4.5` |

If the variable is unset or malformed, the agent uses the OpenAI default.
The configured gateway account must have access to the selected provider and model.

## Runtime settings

- `AI_GATEWAY_API_KEY`: server-side credential used by the existing AI SDK model-routing
  integration. Keep it private; never expose it as a `NEXT_PUBLIC_*` variable.
- `AUAPW_ADMIN_AI_MODEL`: optional model identifier override from the table above.

Configure runtime values in the Netlify site's environment-variable settings, then trigger
a normal Netlify build/deploy through the site's existing approved process. This branch does
not modify Netlify settings or trigger a deployment.

## Direct provider keys are not enabled by this change

This change selects OpenAI or Claude through the existing AI Gateway route. It does **not**
add the standalone `@ai-sdk/openai` or `@ai-sdk/anthropic` packages, and it does not
make `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` direct credentials for the admin agent.
Direct vendor-key support requires adding the relevant provider package(s), regenerating
`pnpm-lock.yaml`, and passing frozen-lockfile CI checks. Do not set either vendor API key
expecting this branch to consume it.

## Safety boundaries

- The admin assistant endpoint remains protected by the existing admin session and same-origin
  check.
- Existing catalog write tools continue to require explicit in-chat approval.
- This change does not add database migrations, change authentication, send customer messages,
  run code, or deploy the site.
