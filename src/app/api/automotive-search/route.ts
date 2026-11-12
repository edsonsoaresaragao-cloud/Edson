import { createSearchHandler } from "@/lib/automotive-search/handler";
import { createAutomotiveSearch } from "@/lib/automotive-search/service";
import {
  automotiveStore,
  type QueryStore,
} from "@/lib/automotive-search/store";
import { jobsFor } from "@/lib/automotive-search/providers";
import { emptyInput } from "@/lib/automotive-search/contracts";
export const dynamic = "force-dynamic";
const database: QueryStore = {
  async $queryRaw<T>(strings: TemplateStringsArray, ...values: unknown[]) {
    const { db } = await import("@/lib/db");
    return db.$queryRaw<T>(strings, ...values);
  },
  async $executeRaw(strings, ...values) {
    const { db } = await import("@/lib/db");
    return db.$executeRaw(strings, ...values);
  },
};
const storage = automotiveStore(database);
const search = createAutomotiveSearch({
  cache: storage.cache,
  async beforeCall(provider) {
    const { rateLimit } = await import("@/lib/auth");
    const date = new Date().toISOString().slice(0, 10),
      month = date.slice(0, 7);
    const bounded = (v: string | undefined, fallback: number) =>
      Math.max(1, Math.min(10000, Number(v) || fallback));
    if (provider === "ai") {
      await rateLimit(
        "automotive:ai:" + date,
        bounded(process.env.AUTOMOTIVE_AI_DAILY_LIMIT, 20),
        86400,
      );
    } else if (provider === "youtube") {
      await rateLimit(
        "automotive:youtube:" + date,
        bounded(process.env.AUTOMOTIVE_YOUTUBE_DAILY_SEARCHES, 5),
        86400,
      );
    } else {
      await rateLimit(
        "automotive:web:day:" + date,
        bounded(process.env.AUTOMOTIVE_WEB_DAILY_LIMIT, 60),
        86400,
      );
      await rateLimit(
        "automotive:web:month:" + month,
        bounded(process.env.AUTOMOTIVE_WEB_MONTHLY_LIMIT, 500),
        2678400,
      );
    }
  },
});
let windowStart = 0,
  count = 0;
export const GET = createSearchHandler({
  async guard() {
    if (Date.now() - windowStart > 60000) {
      windowStart = Date.now();
      count = 0;
    }
    if (++count > 90)
      throw Object.assign(new Error("rate_limit"), { status: 429 });
    if (jobsFor({ ...emptyInput, q: "config" }, process.env).length) {
      const { rateLimit } = await import("@/lib/auth");
      await rateLimit("automotive:requests:minute", 30, 60);
    }
  },
  search: (q) => search(q, process.env),
});
