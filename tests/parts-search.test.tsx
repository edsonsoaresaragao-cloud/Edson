import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fixture from "./fixtures/parts-search.json";
import {
  partsQuerySchema,
  buildPartsQuery,
  publicHttps,
  brlPrice,
  externalPartsSearches,
  canonicalOfferUrl,
} from "../src/lib/parts/catalog";
import {
  providerJobs,
  parseProviderPage,
  mergeOffers,
} from "../src/lib/parts/providers";
import {
  createPartsSearchService,
  PartsQuotaError,
} from "../src/lib/parts/service";
import { createPartsSearchHandler } from "../src/lib/parts/handler";
import { PartsMarketplace } from "../src/components/parts-marketplace";
const env = { PARTS_SERPAPI_KEY: "private-test-key" },
  q = partsQuerySchema.parse({
    q: "Pastilha de freio",
    code: "TEST-123",
    brand: "Chevrolet",
    model: "Onix",
    year: "2020",
    engine: "1.0 turbo",
  });
const fakeFetch: typeof fetch = async (input) => {
  const url = new URL(String(input));
  return Response.json(
    url.searchParams.get("engine") === "google_shopping"
      ? fixture.shopping
      : fixture.web,
  );
};
test("consulta inclui veículo, código e página com limites explícitos", () => {
  assert.equal(
    buildPartsQuery(q),
    "Pastilha de freio TEST-123 Chevrolet Onix 2020 1.0 turbo",
  );
  assert.equal(
    partsQuerySchema.safeParse({ ...q, q: "x", code: "" }).success,
    false,
  );
  assert.equal(partsQuerySchema.safeParse({ ...q, page: 6 }).success, false);
  assert.equal(
    partsQuerySchema.safeParse({ ...q, year: "20200" }).success,
    false,
  );
  assert.equal(
    partsQuerySchema.safeParse({ ...q, q: "a".repeat(121) }).success,
    false,
  );
});
test("provedores usam endpoints fixos, localização BR e segredos só no servidor", () => {
  const jobs = providerJobs(buildPartsQuery(q), 2, env);
  assert.equal(jobs.length, 2);
  assert.equal(jobs[0].url.origin, "https://serpapi.com");
  assert.equal(jobs[0].url.searchParams.get("gl"), "br");
  assert.equal(jobs[0].url.searchParams.get("start"), "20");
  assert.equal(jobs[1].url.searchParams.get("start"), "10");
  const brave = providerJobs("sensor MAP", 1, {
    PARTS_BRAVE_API_KEY: "brave-private",
  });
  assert.equal(brave.length, 1);
  assert.equal(brave[0].url.origin, "https://api.search.brave.com");
  assert.equal(brave[0].headers["X-Subscription-Token"], "brave-private");
});
test("URLs inseguras são descartadas e reais perdem apenas rastreamento", () => {
  for (const value of [
    "javascript:alert(1)",
    "http://loja.com/produto/a",
    "https://user:pass@loja.com/p/a",
    "https://127.0.0.1/p/a",
    "https://2130706433/p/a",
    "https://localhost./p/a",
    "https://server.internal/p/a",
    "https://[::1]/p/a",
    "data:image/svg+xml,test",
    "https://serpapi.com/search.json?api_key=private-test-key",
  ])
    assert.equal(publicHttps(value), null, value);
  assert.equal(
    canonicalOfferUrl("https://loja.com/produto/a?sku=1&utm_source=x#foo"),
    "https://loja.com/produto/a?sku=1",
  );
});
test("preço numérico só entra na comparação quando é BRL inequívoco", () => {
  assert.equal(brlPrice("R$ 1.234,56"), 1234.56);
  assert.equal(brlPrice("49.90", "BRL"), 49.9);
  assert.equal(brlPrice("$19.00"), null);
  assert.equal(brlPrice(99), null);
  assert.equal(brlPrice("R$ 99 a R$ 150"), null);
});
test("normalização preserva foto, descrição, origem e distinção entre anúncio e Google Shopping", () => {
  const jobs = providerJobs("pastilha", 1, env);
  const shopping = parseProviderPage(fixture.shopping, jobs[0], q),
    web = parseProviderPage(fixture.web, jobs[1], q);
  assert.equal(shopping.offers.length, 2);
  assert.equal(web.offers.length, 2);
  const offers = mergeOffers([...shopping.offers, ...web.offers]);
  assert.equal(offers.length, 3);
  const part = offers.find((o) => o.codeMatch)!;
  assert.equal(part.price, 129.9);
  assert.ok(part.description.includes("Descrição fornecida"));
  assert.equal(part.image, "https://images.test-store.com.br/peca.jpg");
  assert.equal(part.url, "https://loja.test-store.com.br/produto/pastilha");
  assert.equal(
    offers.find((o) => o.destination === "shopping")!.store,
    "Anunciante de teste",
  );
  assert.equal(shopping.hasNext, true);
  const brave = providerJobs("sensor", 1, { PARTS_BRAVE_API_KEY: "test" });
  assert.equal(
    parseProviderPage(fixture.brave, brave[0], q).offers[0].image,
    "https://images.test-store.com.br/sensor.jpg",
  );
});
test("sem API não há ofertas fabricadas nem requisições externas", async () => {
  let calls = 0;
  const service = createPartsSearchService({
    fetcher: async () => {
      calls++;
      throw new Error("unexpected");
    },
  });
  const result = await service.search(q, {});
  assert.equal(result.status, "not_configured");
  assert.deepEqual(result.offers, []);
  assert.equal(calls, 0);
  const links = externalPartsSearches("Pastilha Onix 2020");
  assert.equal(links.length, 4);
  assert.ok(links.every((l) => new URL(l.url).protocol === "https:"));
});
test("cache e coalescência evitam consultas duplicadas e expiram no prazo", async () => {
  let now = 0,
    calls = 0;
  const service = createPartsSearchService({
    now: () => now,
    fetcher: async (...args) => {
      calls++;
      return fakeFetch(...args);
    },
  });
  const [first, second] = await Promise.all([
    service.search(q, env),
    service.search(q, env),
  ]);
  assert.equal(calls, 2);
  assert.equal(first.status, "ready");
  assert.equal(second.cached, true);
  assert.equal((await service.search(q, env)).cached, true);
  assert.equal(calls, 2);
  now = 901000;
  assert.equal((await service.search(q, env)).cached, false);
  assert.equal(calls, 4);
});
test("falha parcial mantém resultados reais; erro total e limite não expõem segredos", async () => {
  const partial = createPartsSearchService({
    fetcher: async (input, ...rest) => {
      if (new URL(String(input)).searchParams.get("engine") === "google")
        throw new Error("private-test-key");
      return fakeFetch(input, ...rest);
    },
  });
  const data = await partial.search(q, env);
  assert.equal(data.status, "partial");
  assert.equal(data.offers.length, 2);
  assert.ok(!JSON.stringify(data).includes("private-test-key"));
  const limited = createPartsSearchService({
    beforeCall: async () => {
      throw new PartsQuotaError();
    },
    fetcher: async () => {
      throw new Error("must not call");
    },
  });
  const result = await limited.search(q, env);
  assert.equal(result.status, "unavailable");
  assert.ok(result.sources.every((s) => s.state === "limited"));
});
test("resposta inválida ou excessiva da fonte não se transforma em anúncio", async () => {
  for (const response of [
    () => Response.json({ error: "private-test-key" }),
    () => new Response("{broken"),
    () => new Response("x", { headers: { "content-length": "3000000" } }),
    () => Response.json({}, { status: 429 }),
  ]) {
    const service = createPartsSearchService({
      fetcher: async () => response(),
    });
    const result = await service.search(q, env);
    assert.equal(result.status, "unavailable");
    assert.equal(result.offers.length, 0);
    assert.ok(!JSON.stringify(result).includes("private-test-key"));
  }
});
test("paginação usa parâmetros próprios e nunca retorna URL da API contendo chave", async () => {
  const service = createPartsSearchService({ fetcher: fakeFetch });
  const result = await service.search({ ...q, page: 5 }, env);
  assert.equal(result.hasNext, false);
  assert.ok(!JSON.stringify(result).includes("fixture-key"));
  assert.ok(!JSON.stringify(result).includes("serpapi.com/search"));
});
test("handler valida entrada, trata configuração e limite sem detalhes internos", async () => {
  let calls = 0;
  const service = createPartsSearchService({ fetcher: fakeFetch });
  const handler = createPartsSearchHandler({
    search: (input) => {
      calls++;
      return service.search(input, {});
    },
  });
  assert.equal(
    (await handler(new Request("https://site.com/api/parts-search?q=x")))
      .status,
    400,
  );
  assert.equal(calls, 0);
  assert.equal(
    (await handler(new Request("https://site.com/api/parts-search?q=pastilha")))
      .status,
    503,
  );
  const quota = createPartsSearchHandler({
    search: (input) => service.search(input, env),
    guard: async () => {
      throw Object.assign(new Error("private details"), { status: 429 });
    },
  });
  const response = await quota(
    new Request("https://site.com/api/parts-search?q=pastilha"),
  );
  assert.equal(response.status, 429);
  assert.ok(!(await response.text()).includes("private details"));
});
test("interface SSR preserva consulta compartilhável, formulário e separação da pesquisa externa", () => {
  const html = renderToStaticMarkup(
    createElement(PartsMarketplace, {
      initial: {
        buy: "Pastilha",
        carBrand: "Chevrolet",
        carModel: "Onix",
        carYear: "2020",
        partCode: "TEST-123",
      },
    }),
  );
  for (const value of [
    "Buscar ofertas",
    "Código da peça",
    "Chevrolet",
    "Onix",
    "2020",
    "TEST-123",
    "atalhos de pesquisa externa",
    "Mercado Livre",
    "Amazon Brasil",
  ])
    assert.ok(html.includes(value), value);
  assert.ok(html.includes('aria-busy="true"'));
  assert.ok(!html.includes("R$ 129,90"));
});

test("metadados de produto permitem lojas com URLs próprias e não transformam páginas iniciais em ofertas", () => {
  const jobs = providerJobs("peça", 1, env);
  const data = {
    organic_results: [
      {
        title: "Peça com URL própria",
        link: "https://outra-loja.com.br/peca-especifica",
        pagemap: {
          product: [{ price: "79.90", pricecurrency: "BRL" }],
          metatags: [{ "og:type": "product" }],
        },
      },
      {
        title: "Loja inicial",
        link: "https://outra-loja.com.br/",
        pagemap: { product: [{ price: "79.90" }] },
      },
    ],
  };
  const parsed = parseProviderPage(data, jobs[1], q);
  assert.equal(parsed.offers.length, 1);
  assert.equal(parsed.offers[0].price, 79.9);
});

test("busca aceita apenas o código sem exigir nome de peça", async () => {
  const codeOnly = partsQuerySchema.parse({ code: "TEST-123" });
  assert.equal(codeOnly.q, "");
  assert.equal(buildPartsQuery(codeOnly), "TEST-123");
  const service = createPartsSearchService({ fetcher: fakeFetch });
  const handler = createPartsSearchHandler({
    search: (input) => service.search(input, env),
  });
  assert.equal(
    (
      await handler(
        new Request("https://site.com/api/parts-search?code=TEST-123"),
      )
    ).status,
    200,
  );
  assert.equal(partsQuerySchema.safeParse({ code: "T" }).success, false);
});
