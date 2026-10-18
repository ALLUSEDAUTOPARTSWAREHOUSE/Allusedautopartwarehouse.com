import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Check AUAPW website availability and summarize the current business operations status.",
  inputSchema: z.object({}),
  async execute() {
    const startedAt = Date.now();
    const origin = process.env.AUAPW_PUBLIC_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
    let website = { status: "unknown", url: origin ?? "not configured" };

    if (origin) {
      const url = origin.startsWith("http") ? origin : `https://${origin}`;
      try {
        const response = await fetch(url, { method: "HEAD", cache: "no-store" });
        website = { status: response.ok ? "operational" : `http_${response.status}`, url };
      } catch {
        website = { status: "unreachable", url };
      }
    }

    return {
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      website,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      message: "Use the Admin Operations and Orders pages for detailed live records.",
    };
  },
});
