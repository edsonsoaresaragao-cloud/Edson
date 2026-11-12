import { createUnifiedHandler } from "@/lib/automotive-search/unified";
import { productionPartsHandler } from "@/lib/parts/runtime";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Reuse both production handlers: credentials, quotas, caches and timeouts stay
// on the server. No HTTP call back to the portal and no model-generated prices.
export const GET = createUnifiedHandler({
  technical: async (request) => (await import("../route")).GET(request),
  commercial: productionPartsHandler(true),
});
