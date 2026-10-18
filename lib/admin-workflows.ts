/** First-party workflow guidance; no external skill packages or executable scripts. */
export const BUSINESS_WORKFLOWS = [
  {
    id: 'marketing', title: 'Marketing',
    description: 'Draft campaigns and content grounded in catalog and feed records.',
    prompt: 'Run the marketing workflow: prepare a campaign brief and draft content using verified catalog records. Ask for audience, channel and brand voice when missing. Do not publish anything.',
    instructions: 'Ask for audience, channel, objective and brand voice. Use searchProducts and getGoogleFeedHistory for relevant catalog evidence. Return a campaign brief, draft copy, channel plan and measurement plan. Do not invent prices, availability, competitor research, attribution or channel performance; external marketing analytics are not connected. Label copy as draft. Never publish or send.',
  },
  {
    id: 'audit', title: 'Audit',
    description: 'Review evidence, configuration claims and reporting calculations.',
    prompt: 'Run the audit workflow: review operations evidence, separate verified facts from assumptions, and list checks that still require deployment or provider evidence.',
    instructions: 'Use getOperationsOverview and checkWebsiteConfiguration for configuration evidence. Return a claim/evidence/verdict/next-check report. Presence is not connectivity. These tools cannot verify deployment readiness, remote restarts or build logs; request those records and mark unverified rather than claiming a deployment succeeded. Check arithmetic when supplied, distinguish percent change from percentage-point change, and never multiply unsupported probability estimates. Do not execute code or dispatch remote agents.',
  },
  {
    id: 'data', title: 'Data',
    description: 'Analyze connected records with explicit sources and sample limits.',
    prompt: 'Run the data workflow: summarize recorded business activity and trends, stating time windows, sample limits and missing data. Ask which business question to investigate if needed.',
    instructions: 'Clarify the business question and time window. Use getBusinessMetrics for revenue and orders, getGoogleFeedHistory for feed trends, and targeted record tools for follow-up. Return a source-labeled table, findings and limitations. Do not execute arbitrary SQL, claim a complete dataset from a recent-record sample, or invent charts, costs, refunds or accounting losses. Include source timestamps, currency, time zone and missing sections. Revenue differences are not profit or loss.',
  },
  {
    id: 'product', title: 'Product management',
    description: 'Turn observed problems into reviewable specs and roadmaps.',
    prompt: 'Run the product management workflow: draft a feature specification and prioritized roadmap from the business problem and available operational evidence. Ask for the problem if missing.',
    instructions: 'Ask for the problem, target users and success criteria. Use operational tools only where relevant. Return problem statement, evidence, scope/non-goals, requirements, acceptance criteria, risks, dependencies and a prioritized roadmap. Label estimates and hypotheses. Do not claim customer research, create tickets, change dependencies or deploy code. Keep catalog operations distinct from software product planning.',
  },
  {
    id: 'sales', title: 'Sales',
    description: 'Prioritize leads, prepare calls and draft customer follow-ups.',
    prompt: 'Run the sales workflow: review the priority work queue, prepare call notes and draft follow-ups for leads and orders. Do not send messages or change records.',
    instructions: 'Use getPriorityWorkQueue, listOpenQuotes and exact order lookup for relevant records. Return prioritized follow-ups, concise call preparation and draft replies. Forecast only when supported by explicit amounts, stage definitions and a stated method; otherwise mark unavailable. Never invent deal probabilities, delivery dates or customer promises. CRM email, calendar booking and message sending are not connected. Do not send, book or update customer records. Minimize customer personal data.',
  },
] as const
