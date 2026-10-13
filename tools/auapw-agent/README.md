# AUAPW Eve agent

Separate Eve agent project; it does not replace the website Store Assistant.

## Local checks and use

Run from this directory:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm dev
```

Model: `google/gemini-3.7-flash` through the selected model connection. Model credits/access must be verified. No credentials are committed. Do not expose the built-in HTTP service publicly until authentication and record permissions are implemented.

Implemented: automotive instructions and static workspace guidance tool.

Not implemented: live catalog/order/quote access, customer/supplier permissions, Slack, Linear, document indexing, persistent business memory, website UI integration or deployment. No messages are sent or data modified.
