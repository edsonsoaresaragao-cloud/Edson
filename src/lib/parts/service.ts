import { createHash } from "node:crypto";
import {
  buildPartsQuery,
  partsQuerySchema,
  type PartsQuery,
  type PartsResult,
  type SourceStatus,
} from "./catalog";
import {
  providerJobs,
  publicProviderJobs,
  parseProviderPage,
  mergeOffers,
  type Provider,
} from "./providers";
import { parsePublicSearch, enrichPublicOffers } from "./public-search";
import { PartsQuotaError, readPartsResponse } from "./http";
export { PartsQuotaError } from "./http";
export function boundedSetting(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const n = Number(value);
  return value && Number.isFinite(n)
    ? Math.min(max, Math.max(min, Math.floor(n)))
    : fallback;
}
type Dependencies = {
  fetcher?: typeof fetch;
  now?: () => number;
  beforeCall?: (provider: Provider) => Promise<void>;
};
export function createPartsSearchService(deps: Dependencies = {}) {
  const fetcher = deps.fetcher || fetch,
    now = deps.now || Date.now;
  const cache = new Map<string, { expires: number; result: PartsResult }>(),
    pending = new Map<string, Promise<PartsResult>>();
  async function search(
    input: PartsQuery,
    env: Record<string, string | undefined>,
  ): Promise<PartsResult> {
    const q = partsQuerySchema.parse(input),
      query = buildPartsQuery(q),
      jobs = providerJobs(query, q.page, env),
      base = {
        offers: [],
        sources: [],
        query,
        page: q.page,
        hasNext: false,
        queriedAt: new Date(now()).toISOString(),
        cached: false,
      };
    if (!jobs.length) return { ...base, status: "not_configured" };
    const key = createHash("sha256")
      .update(
        JSON.stringify({
          q,
          jobs: jobs.map((j) => [j.id, j.url.href, j.headers]),
          publicSearch: env.PARTS_PUBLIC_SEARCH_ENABLED !== "false",
        }),
      )
      .digest("hex");
    const saved = cache.get(key);
    if (saved && saved.expires > now()) {
      cache.delete(key);
      cache.set(key, saved);
      return { ...saved.result, cached: true };
    }
    cache.delete(key);
    const inflight = pending.get(key);
    if (inflight) return { ...(await inflight), cached: true };
    const task = (async () => {
      async function consult(batch: Provider[]) {
        return Promise.all(
          batch.map(async (provider) => {
            try {
              if (!provider.format || provider.format === "json")
                await deps.beforeCall?.(provider);
              const response = await fetcher(provider.url, {
                headers: provider.headers,
                signal: AbortSignal.timeout(
                  provider.format && provider.format !== "json" ? 6000 : 8000,
                ),
                cache: "no-store",
                redirect: "error",
              });
              const body = await readPartsResponse(response);
              const page =
                provider.format && provider.format !== "json"
                  ? parsePublicSearch(body, provider, q)
                  : parseProviderPage(JSON.parse(body), provider, q);
              return {
                source: {
                  id: provider.id,
                  label: provider.label,
                  state: "ok",
                } as SourceStatus,
                page,
              };
            } catch (error) {
              console.warn("[parts-search] source_failure", {
                provider: provider.id,
                reason:
                  error instanceof PartsQuotaError ? "quota" : "unavailable",
              });
              return {
                source: {
                  id: provider.id,
                  label: provider.label,
                  state:
                    error instanceof PartsQuotaError
                      ? "limited"
                      : "unavailable",
                } as SourceStatus,
                page: null,
              };
            }
          }),
        );
      }
      const results = await consult(jobs);
      let usedPublic = jobs.some(
        (job) => job.format === "rss" || job.format === "html",
      );
      // A missing key, exhausted paid quota or empty paid response must not
      // prevent the public sources from being queried.
      if (
        !usedPublic &&
        !results.some((result) => result.page?.offers.length)
      ) {
        const fallback = publicProviderJobs(query, q.page, env);
        if (fallback.length) {
          usedPublic = true;
          results.push(...(await consult(fallback)));
        }
      }
      const successful = results.filter((r) => r.page);
      const status =
        successful.length === results.length
          ? "ready"
          : successful.length
            ? "partial"
            : "unavailable";
      let offers = mergeOffers(results.flatMap((r) => r.page?.offers || []));
      if (usedPublic && offers.length)
        offers = await enrichPublicOffers(offers, q, fetcher);
      const result: PartsResult = {
        ...base,
        status,
        queriedAt: new Date(now()).toISOString(),
        offers: offers.map((offer) => ({
          ...offer,
          checkedAt: new Date(now()).toISOString(),
        })),
        publicSearch: usedPublic,
        hasNext: q.page < 5 && results.some((r) => r.page?.hasNext),
        sources: results.map((r) => r.source),
      };
      if (successful.length) {
        const ttl =
          status === "partial"
            ? 60
            : boundedSetting(env.PARTS_SEARCH_CACHE_SECONDS, 900, 60, 1800);
        cache.set(key, { result, expires: now() + ttl * 1000 });
        while (cache.size > 100) cache.delete(cache.keys().next().value!);
      }
      return result;
    })();
    pending.set(key, task);
    try {
      return await task;
    } finally {
      pending.delete(key);
    }
  }
  return { search };
}
