import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  partsQuerySchema,
  buildPartsQuery,
  isProductPage,
} from "../src/lib/parts/catalog";
import { providerJobs, mergeOffers } from "../src/lib/parts/providers";
import {
  parsePublicSearch,
  merchantMetadataUrl,
  parseMerchantMetadata,
  enrichPublicOffers,
  publicResultUrl,
} from "../src/lib/parts/public-search";
import {
  createPartsSearchService,
  PartsQuotaError,
} from "../src/lib/parts/service";
import { createPartsSearchHandler } from "../src/lib/parts/handler";
import { matchingPartReferences } from "../src/lib/parts/references";
import { PartsMarketplace } from "../src/components/parts-marketplace";
const rss = readFileSync("tests/fixtures/parts-public-search.rss", "utf8"),
  html = readFileSync("tests/fixtures/parts-public-search.html", "utf8"),
  product = readFileSync("tests/fixtures/parts-merchant-product.html", "utf8");
const q = partsQuerySchema.parse({
  q: "senso maf",
  brand: "chevrolet",
  model: "onix",
  year: "2022",
  engine: "1.0",
});
const jobs = providerJobs(buildPartsQuery(q), 1, {});
const publicFetch: typeof fetch = async (input) => {
  const url = new URL(String(input));
  if (url.hostname === "www.bing.com")
    return new Response(rss, {
      headers: { "content-type": "application/rss+xml" },
    });
  if (url.hostname === "html.duckduckgo.com")
    return new Response(html, { headers: { "content-type": "text/html" } });
  if (url.hostname === "www.karhub.com.br")
    return new Response(product, { headers: { "content-type": "text/html" } });
  throw new Error("unexpected test destination");
};

test("sem chave são consultadas fontes públicas, com correção limitada do erro do pedido", () => {
  assert.equal(buildPartsQuery(q), "sensor maf chevrolet onix 2022 1.0");
  assert.equal(jobs.length, 2);
  assert.equal(jobs[0].format, "rss");
  assert.equal(jobs[1].format, "html");
  assert.ok(jobs.every((job) => !job.url.searchParams.has("api_key")));
  assert.equal(
    providerJobs("peça", 1, { SERPAPI_API_KEY: "private" })[0].label,
    "Google Shopping",
  );
  assert.equal(
    providerJobs("peça", 1, { BRAVE_SEARCH_API_KEY: "private" })[0].label,
    "Brave Search",
  );
});

test("RSS e HTML retornam apenas links de produtos relacionados e mesclam a mesma URL", () => {
  assert.equal(
    isProductPage(
      "https://produto.mercadolivre.com.br/MLB-123456789-sensor-maf-_JM",
    ),
    true,
  );
  assert.equal(
    merchantMetadataUrl(
      "https://produto.mercadolivre.com.br/MLB-123456789-sensor-maf-_JM",
    ),
    "https://produto.mercadolivre.com.br/MLB-123456789-sensor-maf-_JM",
  );
  const first = parsePublicSearch(rss, jobs[0], q),
    second = parsePublicSearch(html, jobs[1], q);
  assert.equal(first.offers.length, 2);
  assert.equal(second.offers.length, 1);
  assert.equal(first.hasNext, false);
  assert.equal(second.hasNext, true);
  assert.equal(mergeOffers([...first.offers, ...second.offers]).length, 2);
  assert.equal(first.offers[0].description.includes("<b>"), false);
  assert.equal(first.offers[0].price, null);
  assert.equal(
    first.offers[1].image,
    "https://images.test-store.com.br/maf.jpg",
  );
  assert.equal(
    publicResultUrl("//duckduckgo.com/l/?uddg=javascript%3Aalert(1)"),
    null,
  );
});

test("feeds inválidos, declarações de entidade e páginas de verificação não viram ofertas", () => {
  for (const body of [
    "<html>erro</html>",
    '<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss><channel/></rss>',
  ]) {
    assert.throws(() => parsePublicSearch(body, jobs[0], q));
  }
  assert.throws(() =>
    parsePublicSearch(
      '<html><form id="challenge-form">Verify you are human</form></html>',
      jobs[1],
      q,
    ),
  );
});

test("enriquecimento usa somente lojas autorizadas e dados reais do documento recebido", async () => {
  const candidates = parsePublicSearch(rss, jobs[0], q).offers;
  const calls: string[] = [];
  const enriched = await enrichPublicOffers(candidates, q, async (...args) => {
    calls.push(String(args[0]));
    return publicFetch(...args);
  });
  assert.equal(calls.length, 1);
  assert.equal(enriched[0].price, 249.9);
  assert.equal(enriched[0].image, "https://images.test-store.com.br/maf.jpg");
  assert.match(enriched[0].description, /fornecida pela loja de teste/);
  for (const url of [
    "https://127.0.0.1/produto/x",
    "https://www.karhub.com.br.evil.com/produto/x",
    "https://outra-loja.com.br/produto/x",
    "https://www.karhub.com.br/",
    "https://www.karhub.com.br/busca?q=maf",
  ])
    assert.equal(merchantMetadataUrl(url), null);
  const unchanged = parseMerchantMetadata(
    "<html><title>Robot Check</title></html>",
    candidates[0],
    q,
  );
  assert.equal(unchanged, candidates[0]);
});

test("redirecionamento de loja para outro domínio não é seguido e falha mantém o link indexado", async () => {
  const prior = parsePublicSearch(rss, jobs[0], q).offers[0];
  let calls = 0;
  const result = await enrichPublicOffers([prior], q, async () => {
    calls++;
    return new Response(null, {
      status: 302,
      headers: { location: "https://127.0.0.1/private" },
    });
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, [prior]);
});

test("serviço e handler funcionam sem chave com cache, fotos, descrições e links das fontes", async () => {
  let paid = 0,
    calls = 0;
  const service = createPartsSearchService({
    beforeCall: async () => {
      paid++;
    },
    fetcher: async (...args) => {
      calls++;
      return publicFetch(...args);
    },
  });
  const first = await service.search(q, {});
  assert.equal(first.status, "ready");
  assert.equal(first.publicSearch, true);
  assert.equal(first.offers.length, 2);
  assert.equal(first.offers[0].price, 249.9);
  assert.equal(paid, 0);
  assert.equal(calls, 3);
  assert.equal((await service.search(q, {})).cached, true);
  assert.equal(calls, 3);
  const handler = createPartsSearchHandler({
    search: (input) => service.search(input, {}),
  });
  const response = await handler(
    new Request(
      "https://site.com/api/parts-search?q=senso+maf&brand=chevrolet&model=onix&year=2022&engine=1.0",
    ),
  );
  assert.equal(response.status, 200);
  assert.match(JSON.stringify(await response.json()), /Sensor MAF Chevrolet/);
});

test("limite ou falha da API paga usa busca pública sem consumir outro orçamento pago", async () => {
  const service = createPartsSearchService({
    beforeCall: async () => {
      throw new PartsQuotaError();
    },
    fetcher: publicFetch,
  });
  const result = await service.search(q, { PARTS_SERPAPI_KEY: "private-key" });
  assert.equal(result.status, "partial");
  assert.equal(result.offers.length, 2);
  assert.equal(
    result.sources.filter((source) => source.state === "limited").length,
    2,
  );
  assert.ok(!JSON.stringify(result).includes("private-key"));
});

test("falha de todas as fontes não fabrica oferta, mas o sensor pesquisado possui referência visual", async () => {
  const result = await createPartsSearchService({
    fetcher: async () => {
      throw new Error("private failure");
    },
  }).search(q, {});
  assert.equal(result.status, "unavailable");
  assert.deepEqual(result.offers, []);
  assert.equal(matchingPartReferences(q)[0]?.id, "sensor-maf");
  assert.equal(
    matchingPartReferences(partsQuerySchema.parse({ q: "sensor" })).length,
    0,
  );
  assert.equal(
    matchingPartReferences(partsQuerySchema.parse({ code: "SEM-CODIGO-REAL" }))
      .length,
    0,
  );
  const markup = renderToStaticMarkup(
    createElement(PartsMarketplace, {
      initial: {
        buy: "senso maf",
        carBrand: "chevrolet",
        carModel: "onix",
        carYear: "2022",
        carEngine: "1.0",
      },
    }),
  );
  assert.match(markup, /Referência da peça pesquisada/);
  assert.match(markup, /Sensor MAF/);
  assert.match(markup, /não é um anúncio/);
  assert.match(markup, /Ilustração didática gerada/);
  assert.match(markup, /sensor-maf-chevrolet-onix-2022-1.0/);
  assert.doesNotMatch(markup, /249,90/);
});
