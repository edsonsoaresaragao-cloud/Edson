import { z } from "zod";
const text = (max: number) => z.string().trim().max(max).default("");
export const partsQuerySchema = z
  .object({
    q: text(120),
    brand: text(50),
    model: text(60),
    year: z
      .string()
      .regex(/^$|^(19|20)\d{2}$|^2100$/, "Informe um ano válido.")
      .default(""),
    engine: text(60),
    code: text(50),
    page: z.coerce.number().int().min(1).max(5).default(1),
  })
  .refine(
    (value) =>
      (value.q.length === 0 || value.q.length >= 2) &&
      (value.q.length >= 2 || value.code.length >= 3),
    {
      message:
        "Informe o nome da peça (mínimo 2 caracteres) ou um código (mínimo 3).",
      path: ["q"],
    },
  );
export type PartsQuery = z.infer<typeof partsQuerySchema>;
export type Offer = {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string | null;
  store: string;
  host: string;
  price: number | null;
  priceText: string;
  delivery: string;
  source: string;
  destination: "merchant" | "shopping";
  codeMatch: boolean;
};
export type SourceStatus = {
  id: string;
  label: string;
  state: "ok" | "unavailable" | "limited";
};
export type PartsResult = {
  status: "ready" | "partial" | "unavailable" | "not_configured";
  offers: Offer[];
  sources: SourceStatus[];
  queriedAt: string;
  hasNext: boolean;
  page: number;
  query: string;
  cached: boolean;
  publicSearch?: boolean;
};
export function normalizePartText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
export function buildPartsQuery(q: PartsQuery) {
  return [correctPartName(q.q), q.code, q.brand, q.model, q.year, q.engine]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
export function correctPartName(value: string) {
  return value.replace(
    /\b(senso|senor|sensro)\b(?=\s+(maf|map|ckp|cmp|tps|iat|ect|abs|app|tpms)\b)/gi,
    "sensor",
  );
}
/** Public HTTPS targets only. Merchant fetches additionally require a fixed allowlist. */
export function publicHttps(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 3000) return null;
  try {
    const u = new URL(value);
    const h = u.hostname.toLowerCase().replace(/\.$/, "");
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      u.port ||
      [...u.searchParams.keys()].some((k) =>
        /^(api[_-]?key|access_token|authorization|x-api-key)$/i.test(k),
      ) ||
      !h.includes(".") ||
      /^[\d.]+$/.test(h) ||
      h.includes(":") ||
      /^0x/i.test(h) ||
      /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(h) ||
      h.endsWith(".localhost")
    )
      return null;
    u.hostname = h;
    u.hash = "";
    return u.href;
  } catch {
    return null;
  }
}
export function canonicalOfferUrl(value: string) {
  const u = new URL(value);
  u.hash = "";
  for (const key of [...u.searchParams.keys()])
    if (/^(utm_|gclid$|fbclid$|msclkid$)/i.test(key))
      u.searchParams.delete(key);
  u.searchParams.sort();
  return u.href;
}
export function shoppingDestination(url: string) {
  const h = new URL(url).hostname;
  return /(^|\.)google\.(com|com\.br)$/.test(h)
    ? ("shopping" as const)
    : ("merchant" as const);
}
export function isProductPage(url: string, structured = false) {
  const u = new URL(url),
    path = u.pathname;
  if (
    /(^|\.)google\.|(^|\.)(youtube\.com|facebook\.com|instagram\.com|pinterest\.com)/.test(
      u.hostname,
    )
  )
    return false;
  if (
    /^\/$/.test(path) ||
    /\/(search|busca|buscar|lista|category|categorias|blog|noticias|artigos|login|captcha|challenge)(\/|$)/i.test(
      path,
    ) ||
    ["q", "search", "busca", "s"].some((k) => u.searchParams.has(k))
  )
    return false;
  if (structured) return true;
  return (
    /\/(dp|gp\/product|produto[s]?|product[s]?|item|p)\//i.test(path) ||
    /\/MLB-?\d+(?:[-/]|$)/i.test(path) ||
    /\/[^/]+\/p(?:\/|$)/i.test(path) ||
    /\/produto\.aspx$/i.test(path)
  );
}
export function brlPrice(value: unknown, currency?: unknown) {
  if (typeof value === "number")
    return currency === "BRL" && Number.isFinite(value) && value >= 0
      ? value
      : null;
  if (typeof value !== "string" || (!/R\$/.test(value) && currency !== "BRL"))
    return null;
  const s = value.replace(/R\$/g, "").trim();
  if (currency === "BRL" && !/R\$/.test(value) && /^\d+(?:\.\d{1,2})?$/.test(s))
    return Number(s);
  if (!/^\d{1,3}(?:\.\d{3})*(?:,\d{2})?$|^\d+(?:,\d{2})?$/.test(s)) return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}
export function codeIsPresent(code: string, text: string) {
  const normalized = code.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    normalized.length >= 3 &&
    text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .includes(normalized)
  );
}
export function externalPartsSearches(query: string) {
  const encoded = encodeURIComponent(query),
    slug = query.trim().replace(/\s+/g, "-");
  return [
    {
      name: "Mercado Livre",
      url: `https://lista.mercadolivre.com.br/${encodeURIComponent(slug)}`,
    },
    { name: "Amazon Brasil", url: `https://www.amazon.com.br/s?k=${encoded}` },
    {
      name: "Google Shopping",
      url: `https://www.google.com/search?tbm=shop&q=${encoded}`,
    },
    { name: "Bing Shopping", url: `https://www.bing.com/shop?q=${encoded}` },
  ];
}
