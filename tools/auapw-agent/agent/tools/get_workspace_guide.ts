import { defineTool } from "eve/tools";
import { z } from "zod";

const guides = {
  products: { path: "/admin/products", steps: ["Choose the brand", "Preview spreadsheet import", "Review missing prices", "Confirm saving updates"], limitation: "Whole bundled-brand replacement is not implemented." },
  sales: { path: "/admin/sales", steps: ["Review saved orders and quotes", "Open the record management page", "Check last-updated time"], limitation: "This agent cannot retrieve records or contact customers." },
  development: { path: "/admin/development", steps: ["Review configuration readiness", "Store secrets only in protected environment settings", "Verify each integration"], limitation: "This agent cannot execute code or deploy." },
  marketing: { path: "/admin/marketing", steps: ["Review feed eligibility", "Check recorded feed fetches", "Authorize external channels before publishing"], limitation: "Direct Google/social publishing is not connected." },
};
export default defineTool({
  description: "Get static AUAPW workspace guidance. Does not query business data or perform actions.",
  inputSchema: z.object({ workspace: z.enum(["products", "sales", "development", "marketing"]) }),
  execute({ workspace }) {
    return { workspace, source: "Authored workflow guide, not live records", ...guides[workspace] };
  },
});
