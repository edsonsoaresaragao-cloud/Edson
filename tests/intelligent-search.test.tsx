import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createUnifiedHandler,
  commercialInput,
  searchIntent,
} from "../src/lib/automotive-search/unified";
import { emptyInput } from "../src/lib/automotive-search/contracts";
import { offerDetails, lowestComparable } from "../src/lib/parts/details";
import { offerFromRow, mergeOffers } from "../src/lib/parts/providers";
import { parseMerchantMetadata } from "../src/lib/parts/public-search";
import { partsQuerySchema } from "../src/lib/parts/catalog";
import {
  createVehicleCatalog,
  parseVehicleCatalog,
  vehicleCatalogUrl,
} from "../src/lib/vehicles/catalog";

const q = {
  ...emptyInput,
  q: "Alternador HB20 2026",
  brand: "Hyundai",
  model: "HB20",
  year: "2026",
  engine: "1.0",
  code: "TEST-123",
};
test("reconhece intenção sem diagnosticar peça e conserva veículo no texto livre", () => {
  for (const [query, intent] of [
    ["Comprar alternador Bosch", "buy"],
    ["Alternador não carrega", "diagnosis"],
    ["Fotos sensor MAP", "images"],
    ["Vídeos ABS", "videos"],
    ["Código de falha P0106", "codes"],
    ["Manual HB20", "manuals"],
    ["Especificações alternador", "specifications"],
    ["Sensor MAP", "learn"],
  ] as const)
    assert.equal(searchIntent(query), intent);
  assert.equal(
    commercialInput({ ...q, q: "Comprar alternador barato para Gol G6" }).q,
    "alternador para Gol G6",
  );
  assert.equal(
    commercialInput({ ...q, q: "Alternador não carrega" }).q,
    "Alternador",
  );
  assert.equal(
    commercialInput({ ...q, q: "senso MAP Onix 2024" }).q,
    "sensor MAP Onix 2024",
  );
  assert.equal(commercialInput(q, 2).code, "TEST-123");
});
test("consulta unificada usa ambos handlers, valida antes da chamada e mantém resultado parcial", async () => {
  let calls = 0;
  const handler = createUnifiedHandler({
    technical: async (req) => {
      calls++;
      assert.equal(new URL(req.url).searchParams.get("year"), "2026");
      return Response.json({ version: 1, sources: [], status: "empty" });
    },
    commercial: async (req) => {
      calls++;
      const p = new URL(req.url).searchParams;
      assert.equal(p.get("code"), "TEST-123");
      assert.equal(p.get("page"), "2");
      throw new Error("PRIVATE_API_KEY");
    },
  });
  const result = await handler(
    new Request(
      "https://portal.test/api?" +
        new URLSearchParams({ ...q, offerPage: "2" }),
    ),
  );
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.commercial, null);
  assert.equal(body.technical.status, "empty");
  assert.equal(body.commercialQuery.engine, "1.0");
  assert.doesNotMatch(JSON.stringify(body), /PRIVATE_API_KEY/);
  assert.equal(
    (await handler(new Request("https://portal.test/api?q=MAP&year=erro")))
      .status,
    400,
  );
  assert.equal(calls, 2);
});
test("ofertas sobrevivem à falha técnica, com resposta de limite sanitizada", async () => {
  const handler = createUnifiedHandler({
    technical: async () => Response.json({ error: "segredo" }, { status: 429 }),
    commercial: async () =>
      Response.json({
        offers: [{ id: "real-returned" }],
        sources: [],
        status: "ready",
      }),
  });
  const body = await (
    await handler(new Request("https://portal.test/api?q=Alternador"))
  ).json();
  assert.equal(body.commercial.offers.length, 1);
  assert.equal(body.technical, null);
  assert.match(body.errors.technical, /Limite/);
  assert.doesNotMatch(JSON.stringify(body), /segredo/);
});
test("metadados comerciais nunca inferem preço, estoque, código ou aplicação do texto", () => {
  const missing = offerDetails(
    { title: "Novo Bosch disponível para HB20", description: "frete grátis" },
    null,
    "",
  );
  assert.equal(missing.brand, null);
  assert.equal(missing.code, null);
  assert.equal(missing.availability, "unknown");
  assert.equal(missing.condition, "unknown");
  assert.equal(missing.shipping, null);
  assert.equal(missing.total, null);
  assert.equal(missing.compatibility, "unverified");
  const d = offerDetails(
    {
      brand: { name: "Bosch" },
      sku: "TEST-123",
      applications: ["Aplicação declarada de teste"],
      offer: {
        itemCondition: "https://schema.org/NewCondition",
        availability: "https://schema.org/InStock",
        shippingDetails: { shippingRate: { value: "20.00", currency: "BRL" } },
      },
    },
    150,
    "BRL",
  );
  assert.equal(d.total, 170);
  assert.equal(d.condition, "new");
  assert.equal(d.availability, "in_stock");
  assert.equal(d.compatibility, "declared");
  assert.equal(
    offerDetails({ shipping_price: 10, shipping_currency: "USD" }, 100, "BRL")
      .total,
    null,
  );
});
test("comparação e deduplicação mantêm referências e condições distintas", () => {
  const input = partsQuerySchema.parse(q);
  const make = (url: string, sku: string, price: number, condition = "new") =>
    offerFromRow(
      {
        title: "Alternador de teste",
        link: url,
        brand: "Bosch",
        sku,
        price,
        currency: "BRL",
        condition,
      },
      "API de teste",
      input,
      true,
    )!;
  const a = make("https://loja.test-store.com.br/produto/a", "CODE-A", 100),
    b = make("https://outra.test-store.com.br/produto/a", "CODE-A", 120),
    different = make("https://loja.test-store.com.br/produto/b", "CODE-B", 90),
    used = make(
      "https://loja.test-store.com.br/produto/a",
      "CODE-A",
      60,
      "used",
    );
  assert.deepEqual([...lowestComparable([a, b, different, used])], [a.id]);
  const merged = mergeOffers([a, { ...a }, used]);
  assert.equal(merged.length, 2);
  assert.notEqual(a.id, used.id);
});
test("JSON-LD conserva marca, código, aplicação declarada e frete da oferta original", () => {
  const input = partsQuerySchema.parse({ q: "Alternador" });
  const prior = offerFromRow(
    {
      title: "Alternador",
      link: "https://www.karhub.com.br/alternador-teste/p",
    },
    "Fonte pública",
    input,
    false,
  )!;
  const result = parseMerchantMetadata(
    '<script type="application/ld+json">' +
      JSON.stringify({
        "@type": "Product",
        name: "Alternador",
        brand: { name: "Bosch" },
        sku: "TEST-123",
        isAccessoryOrSparePartFor: { name: "Aplicação declarada" },
        offers: {
          price: "200.00",
          priceCurrency: "BRL",
          itemCondition: "https://schema.org/NewCondition",
          availability: "https://schema.org/InStock",
          shippingDetails: {
            shippingRate: { value: "10.00", currency: "BRL" },
          },
        },
      }) +
      "</script>",
    prior,
    input,
  );
  assert.equal(result.url, prior.url);
  assert.equal(result.details?.brand, "Bosch");
  assert.equal(result.details?.code, "TEST-123");
  assert.equal(result.details?.total, 210);
  assert.equal(result.details?.compatibility, "declared");
});
test("catálogo valida hierarquia, rejeita SSRF e não cria modelos ou anos", async () => {
  assert.equal(
    vehicleCatalogUrl(new URLSearchParams("brand=26&model=4828&year=2026-1")),
    "https://parallelum.com.br/fipe/api/v1/carros/marcas/26/modelos/4828/anos/2026-1",
  );
  for (const params of [
    "brand=https://evil.test",
    "model=4",
    "brand=1&model=2&year=32000-1",
    "url=https://evil.test",
  ])
    assert.throws(() => vehicleCatalogUrl(new URLSearchParams(params)));
  assert.deepEqual(
    parseVehicleCatalog(
      { modelos: [{ codigo: 7, nome: "Modelo retornado pela API" }] },
      new URLSearchParams("brand=26"),
    ),
    [{ id: "7", name: "Modelo retornado pela API" }],
  );
  assert.deepEqual(
    parseVehicleCatalog(
      [
        { codigo: "2026-1", nome: "2026 Gasolina" },
        { codigo: "32000-1", nome: "Zero KM" },
      ],
      new URLSearchParams("brand=26&model=7"),
    ),
    [{ id: "2026-1", name: "2026 Gasolina" }],
  );
  assert.deepEqual(
    parseVehicleCatalog(
      { Modelo: "Versão retornada", Combustivel: "Gasolina" },
      new URLSearchParams("brand=26&model=7&year=2026-1"),
    ),
    [{ id: "2026-1", name: "Versão retornada · Gasolina" }],
  );
  let calls = 0;
  const catalog = createVehicleCatalog(async () => {
    calls++;
    return Response.json([{ codigo: "26", nome: "Hyundai" }]);
  });
  const [a, b] = await Promise.all([
    catalog(new URLSearchParams()),
    catalog(new URLSearchParams()),
  ]);
  assert.equal(calls, 1);
  assert.deepEqual(a, b);
  await catalog(new URLSearchParams());
  assert.equal(calls, 1);
  const broken = createVehicleCatalog(
    async () => new Response("falha", { status: 503 }),
  );
  await assert.rejects(broken(new URLSearchParams()));
});

test("DTC isolado abre referências sem inferir uma peça para compra", async () => {
  let commerce = 0;
  const handler = createUnifiedHandler({
    technical: async () =>
      Response.json({ version: 1, sources: [], status: "empty" }),
    commercial: async () => {
      commerce++;
      return Response.json({ offers: [], sources: [] });
    },
  });
  const body = await (
    await handler(new Request("https://portal.test/api?q=P0106"))
  ).json();
  assert.equal(commerce, 0);
  assert.equal(body.intent, "codes");
  assert.equal(body.commercial, null);
  assert.match(body.errors.commercial, /código DTC/);
});

test("referência OEM sozinha preenche o termo sem inventar veículo", async () => {
  const handler = createUnifiedHandler({
    technical: async (req) => {
      assert.equal(new URL(req.url).searchParams.get("q"), "OEM-123");
      return Response.json({ version: 1, sources: [], status: "empty" });
    },
    commercial: async (req) => {
      const p = new URL(req.url).searchParams;
      assert.equal(p.get("code"), "OEM-123");
      assert.equal(p.get("brand"), "");
      return Response.json({ offers: [], sources: [], status: "ready" });
    },
  });
  const response = await handler(
    new Request("https://portal.test/api?code=OEM-123"),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).query.q, "OEM-123");
});

test("anúncio Shopping não transforma página inicial ou busca da loja em compra de produto", () => {
  const query = partsQuerySchema.parse({ q: "Alternador" });
  assert.equal(
    offerFromRow(
      { title: "Alternador", link: "https://www.amazon.com.br/" },
      "Shopping",
      query,
      true,
    ),
    null,
  );
  assert.equal(
    offerFromRow(
      { title: "Alternador", link: "https://www.amazon.com.br/s?k=alternador" },
      "Shopping",
      query,
      true,
    ),
    null,
  );
  const fallback = offerFromRow(
    {
      title: "Alternador",
      merchant_link: "https://www.amazon.com.br/",
      product_link: "https://www.google.com/shopping/product/123",
    },
    "Shopping",
    query,
    true,
  );
  assert.equal(fallback?.url, "https://www.google.com/shopping/product/123");
});

test(
  "stream entrega ofertas antes de aguardar a pesquisa técnica lenta",
  { timeout: 2000 },
  async () => {
    const { readUnifiedEvents } =
      await import("../src/lib/automotive-search/stream");
    const delayed = Promise.withResolvers<Response>(),
      early = Promise.withResolvers<void>();
    const handler = createUnifiedHandler({
      technical: () => delayed.promise,
      commercial: async () =>
        Response.json({ offers: [], sources: [], status: "ready" }),
    });
    const response = await handler(
      new Request("https://portal.test/api?q=Alternador&stream=1"),
    );
    assert.match(response.headers.get("content-type")!, /ndjson/);
    const events: string[] = [];
    const done = readUnifiedEvents(response, (event) => {
      events.push(event.type);
      if (event.type === "commercial") early.resolve();
    });
    await early.promise;
    assert.deepEqual(events, ["meta", "commercial"]);
    delayed.resolve(
      Response.json({ version: 1, sources: [], status: "empty" }),
    );
    await done;
    assert.deepEqual(events, ["meta", "commercial", "technical", "complete"]);
  },
);

test("stream interrompido conserva eventos recebidos e informa a falha", async () => {
  const { readUnifiedEvents } =
    await import("../src/lib/automotive-search/stream");
  const events: string[] = [];
  const response = new Response(
    JSON.stringify({
      type: "commercial",
      outcome: { value: { offers: [] }, error: null },
    }) + "\n",
    { headers: { "Content-Type": "application/x-ndjson" } },
  );
  await assert.rejects(
    readUnifiedEvents(response, (e) => events.push(e.type)),
    /preservados/,
  );
  assert.deepEqual(events, ["commercial"]);
});

test("API aceita categoria, paginação e ordenação e rejeita opções inválidas", async () => {
  let commerce = 0;
  const handler = createUnifiedHandler({
    technical: async () =>
      Response.json({ version: 1, sources: [], status: "empty" }),
    commercial: async () => {
      commerce++;
      return Response.json({
        offers: [
          { id: "b", price: 200 },
          { id: "a", price: 100 },
        ],
        sources: [],
        status: "ready",
      });
    },
  });
  const response = await handler(
    new Request(
      "https://portal.test/api?q=Alternador&scope=commercial&offerPage=2&tab=PE%C3%87AS&sort=low",
    ),
  );
  const body = await response.json();
  assert.equal(body.commercial.offers[0].id, "a");
  assert.equal(body.technical, null);
  assert.equal(body.commercialQuery.page, 2);
  await handler(
    new Request("https://portal.test/api?q=Alternador&scope=technical"),
  );
  assert.equal(commerce, 1);
  for (const tail of [
    "scope=foo",
    "sort=foo",
    "offerPage=6",
    "tab=foo",
    "stream=true",
  ])
    assert.equal(
      (
        await handler(
          new Request("https://portal.test/api?q=Alternador&" + tail),
        )
      ).status,
      400,
    );
});

test("DTC com modelo e ano também não determina uma peça para substituir", async () => {
  let commerce = 0;
  const handler = createUnifiedHandler({
    technical: async () =>
      Response.json({ version: 1, sources: [], status: "empty" }),
    commercial: async () => {
      commerce++;
      return Response.json({ offers: [], sources: [] });
    },
  });
  const body = await (
    await handler(new Request("https://portal.test/api?q=P0106%20Onix%202024"))
  ).json();
  assert.equal(body.intent, "codes");
  assert.equal(commerce, 0);
  assert.match(body.errors.commercial, /DTC/);
});

test("comércio unificado sem API e sem permissão pública retorna configuração, sem rede ou banco", async () => {
  const { productionPartsHandler } = await import("../src/lib/parts/runtime");
  const response = await productionPartsHandler(true, () => ({}))(
    new Request("https://portal.test/api?q=Alternador"),
  );
  const body = await response.json();
  assert.equal(body.status, "not_configured");
  assert.deepEqual(body.offers, []);
  assert.deepEqual(body.sources, []);
});
