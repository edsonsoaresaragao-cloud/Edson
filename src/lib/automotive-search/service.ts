import { createHash } from "node:crypto";
import {
  searchSchema,
  sourceHosts,
  type SearchInput,
  type SearchResponse,
} from "./contracts";
import { interpretQuery, localReferences } from "./interpret";
import { jobsFor, parseJob, rankSources } from "./providers";
import { synthesize } from "./ai";
import { PartsQuotaError, readPartsResponse } from "../parts/http";
export type SearchCache = {
  get: (key: string) => Promise<SearchResponse | null>;
  put: (key: string, result: SearchResponse, expires: Date) => Promise<void>;
};
export function searchCacheKey(
  q: SearchInput,
  env: Partial<NodeJS.ProcessEnv>,
) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        version: 2,
        q,
        providers: jobsFor(q, env).map((j) => j.id),
        googleEngine: env.AUTOMOTIVE_GOOGLE_CX || "",
        ai: !!env.OPENAI_API_KEY,
        model: env.AUTOMOTIVE_AI_MODEL || "gpt-4.1-mini",
      }),
    )
    .digest("hex");
}
export function createAutomotiveSearch(
  deps: {
    fetcher?: typeof fetch;
    cache?: SearchCache;
    beforeCall?: (provider: string) => Promise<void>;
    now?: () => number;
  } = {},
) {
  const fetcher = deps.fetcher || fetch,
    now = deps.now || Date.now;
  const memory = new Map<string, { expires: number; result: SearchResponse }>(),
    pending = new Map<string, Promise<SearchResponse>>();
  return async (
    input: SearchInput,
    env: Partial<NodeJS.ProcessEnv>,
  ): Promise<SearchResponse> => {
    const checked = searchSchema.parse(input),
      interpreted = interpretQuery(checked.q),
      q = { ...checked, q: interpreted.corrected },
      jobs = jobsFor(q, env),
      key = searchCacheKey(checked, env),
      ttl = Math.max(
        60,
        Math.min(3600, Number(env.AUTOMOTIVE_CACHE_SECONDS) || 900),
      );
    const local = memory.get(key);
    if (local && local.expires > now())
      return { ...structuredClone(local.result), cached: true };
    memory.delete(key);
    if (pending.has(key))
      return { ...structuredClone(await pending.get(key)!), cached: true };
    const task = (async () => {
      const result: SearchResponse = {
        version: 1,
        localReferences: localReferences(q.q),
        query: checked,
        interpreted: {
          ...interpreted,
          suggestions: [...interpreted.suggestions],
          aliases: [...interpreted.aliases],
        },
        status: "not_configured",
        sources: [],
        images: [],
        answer: null,
        ai: env.OPENAI_API_KEY ? "no_evidence" : "not_configured",
        providers: [],
        queriedAt: new Date(now()).toISOString(),
        cached: false,
        storage: "memory",
      };
      if (!jobs.length) return result;
      try {
        const cached = await deps.cache?.get(key);
        if (
          cached &&
          cached.version === 1 &&
          Array.isArray(cached.sources) &&
          Date.parse(cached.queriedAt) + ttl * 1000 > now()
        )
          return { ...cached, cached: true, storage: "database" as const };
      } catch {
        /* Fall through to a fresh query; provider budgets still apply. */
      }

      const outcomes = await Promise.all(
        jobs.map(async (job) => {
          try {
            await deps.beforeCall?.(job.id);
            const response = await fetcher(job.url, {
              headers: job.headers,
              signal: AbortSignal.timeout(8000),
              redirect: "error",
              cache: "no-store",
            });
            const parsed = parseJob(
              job,
              JSON.parse(await readPartsResponse(response)),
            );
            return { id: job.id, state: "ok" as const, ...parsed };
          } catch (error) {
            console.warn("[automotive-search] source_failure", {
              provider: job.id,
              reason:
                error instanceof PartsQuotaError ? "quota" : "unavailable",
            });
            const limited =
              error instanceof PartsQuotaError ||
              !!(
                error &&
                typeof error === "object" &&
                "status" in error &&
                error.status === 429
              );
            return {
              id: job.id,
              state: limited ? ("limited" as const) : ("unavailable" as const),
              sources: [],
              images: [],
            };
          }
        }),
      );
      result.providers = outcomes.map(({ id, state }) => ({ id, state }));
      if (!jobs.some((j) => j.kind === "web"))
        result.providers.push({ id: "web", state: "not_configured" });
      result.sources = rankSources(
        outcomes.flatMap((v) => v.sources),
        q,
      );
      const imageIds = new Set<string>();
      result.images = outcomes
        .flatMap((v) => v.images)
        .filter((i) => {
          const wanted = sourceHosts[q.source];
          const host = new URL(i.page).hostname;
          if (
            wanted &&
            !wanted.some((h) => host === h || host.endsWith("." + h))
          )
            return false;
          if (imageIds.has(i.id)) return false;
          imageIds.add(i.id);
          return true;
        })
        .slice(0, 18);
      if (
        result.sources.some((s) => s.kind !== "video") &&
        env.OPENAI_API_KEY
      ) {
        try {
          await deps.beforeCall?.("ai");
          const usableSources = result.sources
            .filter((s) => s.kind !== "video")
            .slice(0, 12);
          result.answer = await synthesize(q, usableSources, env, fetcher);
          result.ai = result.answer.facts.length ? "ready" : "no_evidence";
          if (result.ai === "no_evidence") result.answer = null;
        } catch {
          result.ai = "unavailable";
        }
      }
      const successful = outcomes.some((o) => o.state === "ok");
      result.status =
        result.sources.length || result.images.length
          ? outcomes.some((o) => o.state !== "ok") || result.ai !== "ready"
            ? "partial"
            : "ready"
          : successful
            ? "empty"
            : "unavailable";
      if (successful) {
        if (deps.cache) {
          try {
            result.storage = "database";
            await deps.cache.put(key, result, new Date(now() + ttl * 1000));
          } catch {
            result.storage = "memory";
          }
        }
        memory.set(key, {
          expires: now() + ttl * 1000,
          result: structuredClone(result),
        });
        while (memory.size > 100) memory.delete(memory.keys().next().value!);
      }
      return result;
    })();
    pending.set(key, task);
    try {
      return await task;
    } finally {
      pending.delete(key);
    }
  };
}
