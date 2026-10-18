import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Provide safe guidance for checking order status in the AUAPW admin portal.",
  inputSchema: z.object({ orderId: z.string().trim().min(1).optional() }),
  async execute({ orderId }) {
    return {
      orderId: orderId ?? null,
      nextStep: orderId
        ? `Open /admin/orders and search for ${orderId}.`
        : "Open /admin/orders to review recent orders and statuses.",
      note: "This read-only tool does not change order data.",
    };
  },
});
