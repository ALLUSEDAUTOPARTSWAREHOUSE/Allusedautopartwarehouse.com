# AUAPW admin AI model configuration

The admin operations agent uses the AI SDK model-routing interface. Its default model is
`openai/gpt-4o-mini`, matching the model-routing style already used by AUAPW's smart-search
route. The model can be overridden without a source change.

## Runtime settings

- `AI_GATEWAY_API_KEY`: server-side credential used by the existing AI SDK model-routing
  integration. Keep it private; never expose it as a `NEXT_PUBLIC_*` variable.
- `AUAPW_ADMIN_AI_MODEL`: optional model identifier override. If unset or malformed,
  the agent uses `openai/gpt-4o-mini`.

Configure runtime values in the Netlify site's environment-variable settings, then trigger
a normal Netlify build/deploy through the site's existing approved process. This branch does
not modify Netlify settings or trigger a deployment.

## Provider distinction

This change selects an OpenAI model through the repository's existing AI SDK routing path.
It does **not** add the standalone `@ai-sdk/openai` provider or make `OPENAI_API_KEY`
a supported credential for the admin agent. A direct OpenAI API-key integration requires
adding the provider package and regenerating `pnpm-lock.yaml`, followed by the frozen-lockfile
CI checks. Do not set an `OPENAI_API_KEY` expecting this branch to use it.

## Safety boundaries

- The admin assistant endpoint remains protected by the existing admin session and same-origin
  check.
- Existing catalog write tools continue to require explicit in-chat approval.
- This change does not add database migrations, change authentication, send customer messages,
  run code, or deploy the site.
