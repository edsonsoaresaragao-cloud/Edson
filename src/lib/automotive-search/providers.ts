import { createHash } from "node:crypto";
import { publicHttps, canonicalOfferUrl } from "../parts/catalog";
import {
  sourceHosts,
  type SearchInput,
  type SearchSource,
  type MediaResult,
} from "./contracts";
import { normalize } from "./interpret";
type Row = Record<string, unknown>;
const row = (v: unknown): Row =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Row) : {};
const list = (v: unknown) => (Array.isArray(v) ? v : []);
export const clean = (v: unknown, max = 1800) =>
  typeof v === "string"
    ? v
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";
export type Job = {
  id: string;
  url: URL;
  headers: Record<string, string>;
  kind: "web" | "image" | "video";
};
export function jobsFor(
  q: SearchInput,
  env: Partial<NodeJS.ProcessEnv>,
): Job[] {
  const query = [q.q, q.brand, q.model, q.year, q.engine, q.code]
    .filter(Boolean)
    .join(" ");
  const sites =
    q.source === "all"
      ? ""
      : ` (${sourceHosts[q.source].map((h) => "site:" + h).join(" OR ")})`;
  const text = query + " automotivo" + sites;
  const jobs: Job[] = [];
  const google = env.AUTOMOTIVE_GOOGLE_API_KEY,
    cx = env.AUTOMOTIVE_GOOGLE_CX,
    brave =
      env.AUTOMOTIVE_BRAVE_API_KEY ||
      env.BRAVE_SEARCH_API_KEY ||
      env.PARTS_BRAVE_API_KEY;
  if (google && cx)
    for (const kind of ["web", "image"] as const) {
      const url = new URL("https://www.googleapis.com/customsearch/v1");
      Object.entries({
        key: google,
        cx,
        q: text,
        num: "10",
        safe: "active",
        hl: "pt-BR",
        ...(kind === "image" ? { searchType: "image" } : {}),
      }).forEach(([k, v]) => url.searchParams.set(k, v));
      jobs.push({
        id: "google-" + kind,
        url,
        headers: { accept: "application/json" },
        kind,
      });
    }
  if (brave)
    for (const kind of ["web", "image"] as const) {
      const url = new URL(
        "https://api.search.brave.com/res/v1/" +
          (kind === "web" ? "web" : "images") +
          "/search",
      );
      Object.entries({
        q: text,
        country: "BR",
        search_lang: "pt-br",
        count: "10",
        safesearch: kind === "web" ? "moderate" : "strict",
      }).forEach(([k, v]) => url.searchParams.set(k, v));
      jobs.push({
        id: "brave-" + kind,
        url,
        headers: { accept: "application/json", "X-Subscription-Token": brave },
        kind,
      });
    }
  if (env.YOUTUBE_API_KEY) {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    Object.entries({
      key: env.YOUTUBE_API_KEY,
      part: "snippet",
      type: "video",
      maxResults: "6",
      safeSearch: "strict",
      relevanceLanguage: "pt",
      q: query + " automotivo",
      videoEmbeddable: "true",
    }).forEach(([k, v]) => url.searchParams.set(k, v));
    jobs.push({
      id: "youtube",
      url,
      headers: { accept: "application/json" },
      kind: "video",
    });
  }
  return jobs;
}
export function kindFor(
  title: string,
  url: string,
  snippet: string,
): SearchSource["kind"] {
  const text = normalize(title + " " + snippet);
  if (
    new URL(url).pathname.toLowerCase().endsWith(".pdf") ||
    /\b(manual|datasheet|boletim tecnico)\b/.test(text)
  )
    return "manual";
  if (/\b(esquema|diagrama|wiring|schematic)\b/.test(text)) return "diagram";
  if (/\b[pcbu][0-9a-f]{4}\b/.test(text)) return "code";
  if (/\b(diagnostico|defeito|testar|falha|reparo)\b/.test(text))
    return "diagnosis";
  return "web";
}
function source(v: unknown, provider: string): SearchSource | null {
  const r = row(v),
    url = publicHttps(r.link || r.url),
    title = clean(r.title, 300);
  if (!url || !title) return null;
  const canonical = canonicalOfferUrl(url),
    host = new URL(canonical).hostname;
  const snippet = clean(r.snippet || r.description);
  const pagemap = row(r.pagemap),
    thumb = row(r.thumbnail);
  const image = publicHttps(
    row(list(pagemap.cse_image)[0]).src || thumb.original || thumb.src,
  );
  const id =
    "S" + createHash("sha256").update(canonical).digest("hex").slice(0, 12);
  return {
    id,
    title,
    url: canonical,
    host,
    snippet,
    provider,
    kind: kindFor(title, canonical, snippet),
    image,
    imagePage: image ? canonical : null,
    published: null,
    score: 0,
  };
}
export function parseJob(
  job: Job,
  value: unknown,
): { sources: SearchSource[]; images: MediaResult[] } {
  const body = row(value);
  if (body.error) throw new Error("provider_response_error");
  const sources: SearchSource[] = [],
    images: MediaResult[] = [];
  if (job.kind === "video") {
    for (const v of list(body.items)) {
      const r = row(v),
        snippet = row(r.snippet),
        id = clean(row(r.id).videoId, 20);
      if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) continue;
      const url = "https://www.youtube.com/watch?v=" + id,
        title = clean(snippet.title, 300);
      if (!title) continue;
      const image = publicHttps(row(row(snippet.thumbnails).medium).url);
      sources.push({
        id: "Y" + id,
        title,
        url,
        host: "www.youtube.com",
        snippet: clean(snippet.description),
        provider: job.id,
        kind: "video",
        image,
        imagePage: image ? url : null,
        channel: clean(snippet.channelTitle, 160) || null,
        embeddable: true,
        published:
          typeof snippet.publishedAt === "string" &&
          Number.isFinite(Date.parse(snippet.publishedAt))
            ? snippet.publishedAt
            : null,
        score: 0,
      });
    }
  } else if (job.kind === "web") {
    const values = job.id.startsWith("google")
      ? list(body.items)
      : list(row(body.web).results);
    for (const v of values) {
      const item = source(v, job.id);
      if (item) sources.push(item);
    }
  } else {
    for (const v of job.id.startsWith("google")
      ? list(body.items)
      : list(body.results)) {
      const r = row(v),
        image = publicHttps(
          job.id.startsWith("google")
            ? r.link
            : row(r.properties).url || row(r.thumbnail).src,
        ),
        page = publicHttps(
          job.id.startsWith("google") ? row(r.image).contextLink : r.url,
        ),
        title = clean(r.title, 300);
      if (!image || !page || !title) continue;
      images.push({
        id:
          "I" +
          createHash("sha256")
            .update(image + page)
            .digest("hex")
            .slice(0, 12),
        title,
        url: page,
        image,
        page,
        provider: job.id,
      });
    }
  }
  return { sources, images };
}
export function rankSources(sources: SearchSource[], q: SearchInput) {
  const words = normalize(
    [q.q, q.code, q.brand, q.model, q.year, q.engine].filter(Boolean).join(" "),
  )
    .split(" ")
    .filter((w) => w.length > 1);
  const wanted = sourceHosts[q.source];
  const trusted = Object.values(sourceHosts).flat();
  const seen = new Set<string>();
  return sources
    .filter((s) => {
      if (seen.has(s.url)) return false;
      seen.add(s.url);
      return (
        !wanted ||
        s.kind === "video" ||
        wanted.some((h) => s.host === h || s.host.endsWith("." + h))
      );
    })
    .map((s) => ({
      ...s,
      score:
        words.reduce(
          (n, w) =>
            n +
            (normalize(s.title).includes(w)
              ? 5
              : normalize(s.snippet).includes(w)
                ? 1
                : 0),
          0,
        ) +
        (trusted.some((h) => s.host === h || s.host.endsWith("." + h)) ? 5 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.url.localeCompare(b.url))
    .slice(0, 24);
}
