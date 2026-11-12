import { load } from "cheerio";
import {
  canonicalOfferUrl,
  codeIsPresent,
  correctPartName,
  isProductPage,
  normalizePartText,
  publicHttps,
  type Offer,
  type PartsQuery,
} from "./catalog";
import { offerFromRow, type Provider, type ProviderPage } from "./providers";
import { readPartsResponse } from "./http";

const text = (value: string, max = 1000) =>
  load(value).text().replace(/\s+/g, " ").trim().slice(0, max);
const ignoredWords = new Set([
  "de",
  "do",
  "da",
  "dos",
  "das",
  "para",
  "com",
  "e",
  "a",
  "o",
  "um",
  "uma",
  "comprar",
  "peca",
]);

function relevant(
  title: string,
  description: string,
  url: string,
  q: PartsQuery,
) {
  if (!q.q.trim())
    return codeIsPresent(q.code, title + " " + description + " " + url);
  const words = normalizePartText(correctPartName(q.q))
    .split(" ")
    .filter((word) => !ignoredWords.has(word));
  const identity = normalizePartText(title + " " + url).split(" ");
  const acronyms = new Set([
    "maf",
    "map",
    "ckp",
    "cmp",
    "tps",
    "iat",
    "ect",
    "app",
    "tpms",
    "egt",
    "iac",
    "vvt",
    "egr",
    "eps",
    "epb",
  ]);
  if (words.some((word) => acronyms.has(word) && !identity.includes(word)))
    return false;
  const haystack = normalizePartText(title + " " + description + " " + url);
  return words.length > 0 && words.every((word) => haystack.includes(word));
}

export function publicResultUrl(value: string): string | null {
  try {
    const url = new URL(value, "https://html.duckduckgo.com");
    if (/(^|\.)duckduckgo\.com$/.test(url.hostname) && url.pathname === "/l/") {
      return publicHttps(url.searchParams.get("uddg"));
    }
    return publicHttps(url.href);
  } catch {
    return null;
  }
}

export function parsePublicSearch(
  body: string,
  provider: Provider,
  q: PartsQuery,
): ProviderPage {
  const offers: Offer[] = [];
  function add(
    title: string,
    description: string,
    rawUrl: string,
    image?: string,
  ) {
    const url = publicResultUrl(rawUrl);
    if (!url || !isProductPage(url) || !relevant(title, description, url, q))
      return;
    const offer = offerFromRow(
      {
        title: text(title, 240),
        description: text(description),
        link: url,
        thumbnail: image,
      },
      provider.label,
      q,
      false,
    );
    if (offer) offers.push(offer);
  }
  if (provider.format === "rss") {
    if (/<!DOCTYPE|<!ENTITY/i.test(body)) throw new Error("invalid_feed");
    const $ = load(body, { xml: true });
    if (!$("rss > channel").length) throw new Error("invalid_feed");
    $("rss > channel > item")
      .slice(0, 30)
      .each((_, element) => {
        const item = $(element);
        add(
          item.children("title").text(),
          item.children("description").text(),
          item.children("link").text().trim(),
          item.find("enclosure").attr("url"),
        );
      });
    // RSS does not advertise a reliable next page; do not invent pagination.
    return { offers, hasNext: false };
  }
  const $ = load(body);
  if (
    $("#challenge-form, .anomaly-modal, form[action*='anomaly']").length ||
    /verify you are human|unusual traffic|bots use DuckDuckGo too/i.test(
      $("title").text() + " " + $("body").text().slice(0, 3000),
    )
  ) {
    throw new Error("public_source_unavailable");
  }
  const rows = $(".result");
  if (!rows.length && !$(".no-results, .no-results__message").length)
    throw new Error("invalid_search_page");
  rows.slice(0, 30).each((_, element) => {
    const item = $(element),
      link = item.find(".result__a").first();
    if (
      item.hasClass("result--ad") ||
      item.find(".result__badge").text().trim() === "Ad"
    )
      return;
    add(
      link.text(),
      item.find(".result__snippet").text(),
      link.attr("href") || "",
    );
  });
  return {
    offers,
    hasNext: $("form input[name='s']")
      .toArray()
      .some((element) => Number($(element).attr("value")) > (q.page - 1) * 30),
  };
}

// Metadata requests are restricted to known retailer origins. URLs supplied by
// users or an arbitrary indexed site never become general-purpose server fetches.
const metadataHosts = new Set([
  "produto.mercadolivre.com.br",
  "www.mercadolivre.com.br",
  "www.amazon.com.br",
  "www.karhub.com.br",
  "www.pitstop.com.br",
  "www.connectparts.com.br",
  "www.dpaschoal.com.br",
  "www.jocar.com.br",
  "www.autopecasmolina.com.br",
  "www.autozone.com.br",
  "www.mercadocar.com.br",
  "www.mecanizou.com",
]);

export function merchantMetadataUrl(value: string): string | null {
  const url = publicHttps(value);
  if (!url) return null;
  return metadataHosts.has(new URL(url).hostname) && isProductPage(url)
    ? url
    : null;
}

type Row = Record<string, unknown>;
const row = (value: unknown): Row =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : {};
const str = (value: unknown) => (typeof value === "string" ? value : "");
function findProducts(value: unknown, depth = 0): Row[] {
  if (depth > 4 || !value || typeof value !== "object") return [];
  if (Array.isArray(value))
    return value.slice(0, 30).flatMap((item) => findProducts(item, depth + 1));
  const object = row(value),
    type = object["@type"];
  if (
    (Array.isArray(type) ? type : [type]).some(
      (name) => name === "Product" || name === "ProductModel",
    )
  )
    return [object];
  return findProducts(object["@graph"], depth + 1);
}
function imageUrl(value: unknown, base: string): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  const raw = str(candidate) || str(row(candidate).url);
  if (!raw) return null;
  try {
    return publicHttps(new URL(raw, base).href);
  } catch {
    return null;
  }
}

export function parseMerchantMetadata(
  body: string,
  prior: Offer,
  q: PartsQuery,
): Offer {
  const $ = load(body);
  if (
    $("#challenge-form, .g-recaptcha, form[action*='captcha']").length ||
    /captcha|verify your identity|access denied|robot check/i.test(
      $("title").text(),
    )
  )
    return prior;
  const meta = (name: string) =>
    $("meta")
      .filter(
        (_, element) =>
          $(element).attr("property") === name ||
          $(element).attr("name") === name,
      )
      .first()
      .attr("content") || "";
  let products: Row[] = [];
  $("script[type='application/ld+json']")
    .slice(0, 12)
    .each((_, element) => {
      try {
        products = products.concat(findProducts(JSON.parse($(element).text())));
      } catch {
        /* A broken JSON-LD block does not hide the indexed product. */
      }
    });
  const product = products.find((item) =>
    relevant(
      str(item.name),
      str(item.description) + " " + str(item.sku) + " " + str(item.mpn),
      prior.url,
      q,
    ),
  );
  const title = str(product?.name) || meta("og:title");
  if (
    title &&
    !relevant(
      title,
      str(product?.description) || meta("og:description"),
      prior.url,
      q,
    )
  )
    return prior;
  const offer = row(
    Array.isArray(product?.offers) ? product.offers[0] : product?.offers,
  );
  const enriched = offerFromRow(
    {
      title: title || prior.title,
      description:
        str(product?.description) ||
        meta("og:description") ||
        meta("description") ||
        prior.description,
      link: prior.url,
      thumbnail:
        imageUrl(product?.image, prior.url) ||
        imageUrl(meta("og:image"), prior.url) ||
        prior.image,
      source: meta("og:site_name") || prior.store,
      price: offer.price ?? (meta("product:price:amount") || undefined),
      currency: str(offer.priceCurrency) || meta("product:price:currency"),
    },
    prior.source,
    q,
    false,
  );
  if (!enriched) return prior;
  return {
    ...enriched,
    description: text(enriched.description),
    price: enriched.price ?? prior.price,
    priceText: enriched.priceText || prior.priceText,
    codeMatch: prior.codeMatch || enriched.codeMatch,
  };
}

async function metadataPage(
  initial: string,
  fetcher: typeof fetch,
): Promise<string> {
  let url: string | null = merchantMetadataUrl(initial);
  const signal = AbortSignal.timeout(3500);
  for (let redirects = 0; redirects <= 2 && url; redirects++) {
    const response = await fetcher(url, {
      headers: { accept: "text/html" },
      signal,
      redirect: "manual",
      cache: "no-store",
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new Error("invalid_redirect");
      const next = merchantMetadataUrl(new URL(location, url).href);
      if (!next || new URL(next).hostname !== new URL(url).hostname)
        throw new Error("unsafe_redirect");
      url = next;
      continue;
    }
    if (
      !/text\/html|application\/xhtml\+xml/i.test(
        response.headers.get("content-type") || "",
      )
    ) {
      await response.body?.cancel();
      throw new Error("invalid_metadata");
    }
    return readPartsResponse(response, 1_500_000);
  }
  throw new Error("redirect_limit");
}

export async function enrichPublicOffers(
  offers: Offer[],
  q: PartsQuery,
  fetcher: typeof fetch,
): Promise<Offer[]> {
  const eligible = offers
    .filter(
      (offer) =>
        merchantMetadataUrl(offer.url) &&
        (!offer.image || offer.price === null),
    )
    .slice(0, 6);
  const updated = new Map<string, Offer>();
  for (let start = 0; start < eligible.length; start += 3) {
    await Promise.all(
      eligible.slice(start, start + 3).map(async (offer) => {
        try {
          updated.set(
            canonicalOfferUrl(offer.url),
            parseMerchantMetadata(
              await metadataPage(offer.url, fetcher),
              offer,
              q,
            ),
          );
        } catch {
          /* Keep the real indexed link and snippet when a retailer refuses metadata access. */
        }
      }),
    );
  }
  return offers.map(
    (offer) => updated.get(canonicalOfferUrl(offer.url)) || offer,
  );
}
