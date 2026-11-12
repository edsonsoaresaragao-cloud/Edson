import { createPartsSearchHandler } from "./handler";
import {
  createPartsSearchService,
  PartsQuotaError,
  boundedSetting,
} from "./service";
import { providerJobs } from "./providers";
async function rateLimit(key: string, limit: number, seconds: number) {
  return (await import("../auth")).rateLimit(key, limit, seconds);
}
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
let windowStart = 0,
  requests = 0;
export function productionPartsHandler(
  authorizedOnly = false,
  environmentSource: () => Record<string, string | undefined> = () =>
    process.env,
) {
  const environment = () => ({
    ...environmentSource(),
    ...(authorizedOnly
      ? {
          PARTS_PUBLIC_SEARCH_ENABLED:
            environmentSource().PARTS_PUBLIC_SEARCH_ENABLED === "true"
              ? "true"
              : "false",
        }
      : {}),
  });
  return createPartsSearchHandler({
    async guard() {
      if (Date.now() - windowStart > 60000) {
        windowStart = Date.now();
        requests = 0;
      }
      if (++requests > 90)
        throw Object.assign(new Error("rate_limit"), { status: 429 });
      if (providerJobs("config", 1, environment()).length)
        await rateLimit("parts:search:minute", 60, 60);
    },
    search: (q) => service.search(q, environment()),
  });
}
