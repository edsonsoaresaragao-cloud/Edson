import { offerDetails } from "./details";
import { createHash } from "node:crypto";
import {
  brlPrice,
  canonicalOfferUrl,
  codeIsPresent,
  isProductPage,
  publicHttps,
  shoppingDestination,
  type Offer,
  type PartsQuery,
} from "./catalog";
type Row = Record<string, unknown>;
const row = (v: unknown): Row =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Row) : {};
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown, max = 1000) =>
  typeof v === "string"
    ? v
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";
export type Provider = {
  id: string;
  label: string;
  url: URL;
  headers: Record<string, string>;
  format?: "json" | "rss" | "html";
};
export type ProviderPage = { offers: Offer[]; hasNext: boolean };
export function providerJobs(
  query: string,
  page: number,
  env: Record<string, string | undefined>,
): Provider[] {
  const serp = (
      env.PARTS_SERPAPI_KEY ||
      env.SERPAPI_API_KEY ||
      env.SERPAPI_KEY
    )?.trim(),
    brave = (
      env.PARTS_BRAVE_API_KEY ||
      env.BRAVE_SEARCH_API_KEY ||
      env.AUTOMOTIVE_BRAVE_API_KEY
    )?.trim();
  const jobs: Provider[] = [];
  if (serp) {
    const url = new URL("https://serpapi.com/search.json");
    Object.entries({
      engine: "google_shopping",
      q: query,
      gl: "br",
      hl: "pt",
      google_domain: "google.com.br",
      start: String((page - 1) * 20),
      num: "20",
      api_key: serp,
    }).forEach(([k, v]) => url.searchParams.set(k, v));
    jobs.push({
      id: "shopping",
      label: "Google Shopping",
      url,
      headers: { accept: "application/json" },
    });
  }
  if (brave) {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    Object.entries({
      q: query + " comprar peça automotiva",
      country: "BR",
      search_lang: "pt-br",
      count: "20",
      offset: String(page - 1),
      safesearch: "moderate",
    }).forEach(([k, v]) => url.searchParams.set(k, v));
    jobs.push({
      id: "web",
      label: "Brave Search",
      url,
      headers: { accept: "application/json", "X-Subscription-Token": brave },
    });
  } else if (serp) {
    const url = new URL("https://serpapi.com/search.json");
    Object.entries({
      engine: "google",
      q: query + " comprar peça automotiva",
      gl: "br",
      hl: "pt",
      google_domain: "google.com.br",
      start: String((page - 1) * 10),
      num: "10",
      api_key: serp,
    }).forEach(([k, v]) => url.searchParams.set(k, v));
    jobs.push({
      id: "web",
      label: "Google Web",
      url,
      headers: { accept: "application/json" },
    });
  }
  return jobs.length ? jobs : publicProviderJobs(query, page, env);
}
export function publicProviderJobs(
  query: string,
  page: number,
  env: Record<string, string | undefined>,
): Provider[] {
  if (env.PARTS_PUBLIC_SEARCH_ENABLED === "false") return [];
  const bing = new URL("https://www.bing.com/search");
  bing.searchParams.set("q", query + " comprar peça automotiva");
  bing.searchParams.set("format", "rss");
  bing.searchParams.set("mkt", "pt-BR");
  bing.searchParams.set("first", String((page - 1) * 10 + 1));
  const duck = new URL("https://html.duckduckgo.com/html/");
  duck.searchParams.set("q", query + " comprar peça automotiva");
  duck.searchParams.set("kl", "br-pt");
  if (page > 1) duck.searchParams.set("s", String((page - 1) * 30));
  return [
    {
      id: "public-bing",
      label: "Bing · páginas públicas",
      url: bing,
      headers: { accept: "application/rss+xml, application/xml, text/xml" },
      format: "rss",
    },
    {
      id: "public-duckduckgo",
      label: "DuckDuckGo · páginas públicas",
      url: duck,
      headers: { accept: "text/html" },
      format: "html",
    },
  ];
}
export function offerFromRow(
  value: unknown,
  source: string,
  q: PartsQuery,
  shopping: boolean,
): Offer | null {
  const r = row(value);
  const map = row(r.pagemap),
    meta = row(list(map.metatags)[0]),
    product = row(r.product || list(map.product)[0]),
    thumbnail = row(r.thumbnail);
  const structured =
    list(map.product).length > 0 ||
    str(meta["og:type"]).toLowerCase().includes("product");
  const urls = [r.merchant_link, r.link, r.url, r.product_link]
    .map(publicHttps)
    .filter((u): u is string => !!u);
  const url =
    urls.find(
      (u) =>
        shoppingDestination(u) === "merchant" &&
        isProductPage(u, structured || shopping),
    ) ||
    urls.find(
      (u) =>
        shoppingDestination(u) === "shopping" &&
        /^\/shopping\/(product|u)\//.test(new URL(u).pathname),
    );
  if (!url || (!shopping && !isProductPage(url, structured))) return null;
  if (
    shoppingDestination(url) === "shopping" &&
    !/^\/shopping\/(product|u)\//.test(new URL(url).pathname)
  )
    return null;
  if (["serpapi.com", "api.search.brave.com"].includes(new URL(url).hostname))
    return null;
  const title = str(r.title, 240);
  if (!title) return null;
  const description = str(
    r.description ||
      r.snippet ||
      list(r.extensions)
        .filter((v) => typeof v === "string")
        .join(" · "),
  );
  const image =
    [
      r.imageUrl,
      r.thumbnail,
      thumbnail.src,
      row(list(map.cse_image)[0]).src,
      meta["og:image"],
    ]
      .map(publicHttps)
      .find(Boolean) || null;
  const canonical = canonicalOfferUrl(url),
    host = new URL(canonical).hostname;
  const currency = str(
    product.pricecurrency || meta["product:price:currency"] || r.currency,
    8,
  ).toUpperCase();
  const valuePrice =
    r.price ??
    product.price ??
    meta["product:price:amount"] ??
    r.extracted_price;
  const rawPrice =
    typeof valuePrice === "number" ? String(valuePrice) : str(valuePrice, 120);
  const price = brlPrice(valuePrice, currency);
  const priceText =
    price === null && currency && rawPrice && !/[^0-9., ]/.test(rawPrice)
      ? `${currency} ${rawPrice}`
      : rawPrice;
  const details = offerDetails({ ...r, product, meta }, price, currency);
  return {
    details,
    id: createHash("sha256")
      .update(
        JSON.stringify([
          canonical,
          details.brand,
          details.code,
          details.condition,
          details.applications,
        ]),
      )
      .digest("hex")
      .slice(0, 24),
    title,
    description,
    url: canonical,
    image,
    store:
      str(r.source || r.profile_name || meta["og:site_name"], 100) ||
      host.replace(/^www\./, ""),
    host,
    price,
    priceText:
      price !== null
        ? new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(price)
        : priceText,
    delivery: str(r.delivery, 180),
    source,
    destination: shoppingDestination(canonical),
    codeMatch: codeIsPresent(q.code, title + " " + description),
  };
}
export function parseProviderPage(
  data: unknown,
  provider: Provider,
  q: PartsQuery,
): ProviderPage {
  const root = row(data);
  if (root.error || root.type === "ErrorResponse")
    throw new Error("provider_unavailable");
  let rows: unknown[];
  let hasNext = false;
  if (provider.id === "shopping") {
    if (!Array.isArray(root.shopping_results))
      throw new Error("provider_unavailable");
    rows = root.shopping_results;
    hasNext = Boolean(
      row(root.serpapi_pagination).next || row(root.pagination).next,
    );
  } else if (provider.label === "Brave Search") {
    if (!root.web && !root.query) throw new Error("provider_unavailable");
    rows = list(row(root.web).results);
    hasNext = row(root.query).more_results_available === true;
  } else {
    if (!Array.isArray(root.organic_results) && !root.search_information)
      throw new Error("provider_unavailable");
    rows = list(root.organic_results);
    hasNext = Boolean(
      row(root.serpapi_pagination).next || row(root.pagination).next,
    );
  }
  return {
    offers: rows
      .slice(0, 40)
      .map((r) =>
        offerFromRow(r, provider.label, q, provider.id === "shopping"),
      )
      .filter((o): o is Offer => !!o),
    hasNext,
  };
}
export function mergeOffers(offers: Offer[]) {
  const map = new Map<string, Offer>();
  for (const offer of offers) {
    const identity = [
      offer.url,
      offer.details?.brand || "",
      offer.details?.code || "",
      offer.details?.condition || "unknown",
      JSON.stringify(offer.details?.applications || []),
    ].join("|");
    const prior = map.get(identity);
    if (!prior) {
      map.set(identity, { ...offer });
      continue;
    }
    const priced =
      prior.price !== null
        ? prior
        : offer.price !== null
          ? offer
          : prior.priceText
            ? prior
            : offer;
    map.set(identity, {
      ...prior,
      source: [...new Set([...prior.source.split(" · "), offer.source])].join(
        " · ",
      ),
      description: prior.description || offer.description,
      image: prior.image || offer.image,
      price: priced.price,
      priceText: priced.priceText,
      delivery: prior.delivery || offer.delivery,
      details: priced.details || prior.details || offer.details,
      codeMatch: prior.codeMatch || offer.codeMatch,
    });
  }
  return [...map.values()]
    .sort((a, b) => Number(b.codeMatch) - Number(a.codeMatch))
    .slice(0, 50);
}
