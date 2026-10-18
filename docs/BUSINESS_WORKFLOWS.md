# Admin business workflows

Sign in as an admin and open `/admin/ai-workflows` (or any embedded operations assistant). Select Marketing, Audit, Data, Product management or Sales to start a guided conversation. Supply the requested audience, business question, time window or problem. These are first-party playbooks, not installed Anthropic skills or separate background agents.

- **Marketing:** campaign briefs, catalog-grounded draft copy and measurement plans. External channel analytics and competitor research are not connected.
- **Audit:** claim/evidence/verdict reports. Configuration presence does not verify connectivity, deployment success or remote restarts. Supply external evidence where requested.
- **Data:** recorded revenue, order and quote summaries and feed trends. Check timestamps, business time zone, unavailable sections and sample limits. Recorded paid-order revenue is not reconciled profit or loss.
- **Product management:** problem statements, requirements, acceptance criteria, risks and prioritized roadmaps. Does not create tickets or deploy features.
- **Sales:** priority queues, call preparation and draft follow-ups. No email sending, calendar booking or customer-record mutation is enabled.

The existing authenticated assistant API and model access must work. Missing provider access, unavailable database tables or empty datasets must not be interpreted as successful checks. Draft quality and tool selection depend on the model; review every output.

Catalog visibility/feed writes retain individual approval controls. Selecting a workflow does not approve any write. No arbitrary SQL, shell execution, dependency installation or deployment capability is added. Secret values must remain in protected hosting settings, not chat.
