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
  parseProviderPage,
  mergeOffers,
  type Provider,
} from "./providers";
export class PartsQuotaError extends Error {}
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
async function readJson(response: Response) {
  if (response.status === 429) {
    await response.body?.cancel();
    throw new PartsQuotaError();
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error("upstream_failed");
  }
  if (Number(response.headers.get("content-length") || 0) > 2_000_000) {
    await response.body?.cancel();
    throw new Error("oversized_response");
  }
  if (!response.body) throw new Error("invalid_response");
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let size = 0,
    text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2_000_000) {
        await reader.cancel();
        throw new Error("oversized_response");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } finally {
    reader.releaseLock();
  }
}
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
      const results = await Promise.all(
        jobs.map(async (provider) => {
          try {
            await deps.beforeCall?.(provider);
            const response = await fetcher(provider.url, {
              headers: provider.headers,
              signal: AbortSignal.timeout(8000),
              cache: "no-store",
              redirect: "error",
            });
            const data = await readJson(response);
            const page = parseProviderPage(data, provider, q);
            return {
              source: {
                id: provider.id,
                label: provider.label,
                state: "ok",
              } as SourceStatus,
              page,
            };
          } catch (error) {
            return {
              source: {
                id: provider.id,
                label: provider.label,
                state:
                  error instanceof PartsQuotaError ? "limited" : "unavailable",
              } as SourceStatus,
              page: null,
            };
          }
        }),
      );
      const successful = results.filter((r) => r.page);
      const status =
        successful.length === jobs.length
          ? "ready"
          : successful.length
            ? "partial"
            : "unavailable";
      const result: PartsResult = {
        ...base,
        status,
        queriedAt: new Date(now()).toISOString(),
        offers: mergeOffers(results.flatMap((r) => r.page?.offers || [])),
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
