import { rateLimit } from "@/lib/auth";
import { createPartsSearchHandler } from "@/lib/parts/handler";
import {
  createPartsSearchService,
  PartsQuotaError,
  boundedSetting,
} from "@/lib/parts/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const service = createPartsSearchService({
  async beforeCall() {
    const now = new Date(),
      month = now.toISOString().slice(0, 7),
      day = now.toISOString().slice(0, 10);
    try {
      await rateLimit(
        `parts:api:month:${month}`,
        boundedSetting(process.env.PARTS_MONTHLY_API_LIMIT, 100, 1, 100000),
        Math.max(
          60,
          Math.ceil(
            (Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) -
              now.getTime()) /
              1000,
          ),
        ),
      );
      await rateLimit(
        `parts:api:day:${day}`,
        boundedSetting(process.env.PARTS_DAILY_API_LIMIT, 50, 1, 10000),
        86400,
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 429
      )
        throw new PartsQuotaError();
      throw error;
    }
  },
});
export const GET = createPartsSearchHandler({
  async guard() {
    await rateLimit("parts:search:minute", 60, 60);
  },
  search: (q) => service.search(q, process.env),
});
