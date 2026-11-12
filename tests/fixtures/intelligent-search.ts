// Controlled API fixtures for automated tests. Never imported by application code.
import type { Page } from "@playwright/test";
import { createAutomotiveSearch } from "../../src/lib/automotive-search/service";
import { createSearchHandler } from "../../src/lib/automotive-search/handler";
import {
  searchIntent,
  createUnifiedHandler,
} from "../../src/lib/automotive-search/unified";
import { createPartsSearchService } from "../../src/lib/parts/service";
import { createPartsSearchHandler } from "../../src/lib/parts/handler";
import { createVehicleCatalog } from "../../src/lib/vehicles/catalog";
export async function installIntelligentFixture(page: Page) {
  const state = {
    imageFailure: false,
    commercialHasNext: false,
    technicalFailure: false,
    noOffers: false,
    queries: [] as URLSearchParams[],
  };
  const technical = createAutomotiveSearch({
    fetcher: async (input, init) => {
      const url = new URL(String(input));
      if (url.hostname === "api.openai.com") {
        const sent = JSON.parse(String(init?.body));
        const sources = JSON.parse(sent.messages[1].content).sources as {
          id: string;
          title: string;
        }[];
        const id = sources.find((s) => s.title.includes("Funcionamento"))!.id;
        const diagnosis = sources.find((s) =>
          s.title.includes("Diagnóstico"),
        )!.id;
        return Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: searchIntent(
                    JSON.parse(sent.messages[1].content).question.q,
                  ),
                  summary: "Resumo controlado",
                  facts: [
                    {
                      category: "function",
                      text: "O sensor informa a pressão no coletor.",
                      sourceIds: [id],
                      status: "general",
                    },
                    {
                      category: "tools",
                      text: "Ferramenta citada: scanner.",
                      sourceIds: [diagnosis],
                      status: "general",
                    },
                    {
                      category: "tests",
                      text: "Verifique as conexões antes de interpretar a leitura.",
                      sourceIds: [diagnosis],
                      status: "hypothesis",
                    },
                    {
                      category: "decision",
                      text: "Se a conexão estiver danificada, confirme a falha antes de substituir.",
                      sourceIds: [diagnosis],
                      status: "hypothesis",
                    },
                  ],
                  missing: ["Aplicação específica não confirmada."],
                  related: ["Sensor MAP diagnóstico"],
                }),
              },
            },
          ],
        });
      }
      if (url.pathname.includes("/youtube/"))
        return Response.json({
          items: [
            {
              id: { videoId: "abcdefghijk" },
              snippet: {
                title: "Funcionamento — vídeo de teste",
                channelTitle: "Canal de teste",
                description: "Vídeo controlado para teste.",
                publishedAt: "2026-10-01T12:00:00Z",
                thumbnails: {
                  medium: { url: "https://images.test-store.com.br/video.png" },
                },
              },
            },
          ],
        });
      if (url.searchParams.get("searchType") === "image")
        return state.imageFailure
          ? new Response("cota", { status: 429 })
          : Response.json({
              items: [
                {
                  title: "Foto MAP — teste",
                  link: "https://images.test-store.com.br/map.png",
                  image: { contextLink: "https://www.bosch.com/teste-map" },
                },
              ],
            });
      return Response.json({
        items: [
          {
            title: "Funcionamento — material de teste",
            link: "https://www.bosch.com/teste-funcao",
            snippet: "O sensor informa a pressão no coletor.",
          },
          {
            title: "Diagnóstico — material de teste",
            link: "https://www.bosch.com/teste-diagnostico",
            snippet:
              "Ferramenta citada: scanner. Verifique as conexões antes de interpretar a leitura. Se a conexão estiver danificada, confirme a falha antes de substituir.",
          },
          {
            title: "Esquema — material de teste",
            link: "https://www.bosch.com/teste-esquema",
            snippet: "Diagrama para teste de apresentação, sem pinagem.",
          },
          {
            title: "Código P0106 — material de teste",
            link: "https://www.bosch.com/teste-codigo",
            snippet: "Referência controlada do código P0106.",
          },
          {
            title: "Manual — material de teste",
            link: "https://www.bosch.com/teste-manual.pdf",
            snippet: "Documento de teste, aplicação não confirmada.",
          },
        ],
      });
    },
  });
  const technicalHandler = createSearchHandler({
    guard: async () => {},
    search: (q) =>
      technical(q, {
        AUTOMOTIVE_GOOGLE_API_KEY: "PRIVATE_FIXTURE",
        AUTOMOTIVE_GOOGLE_CX: "fixture",
        YOUTUBE_API_KEY: "PRIVATE_YT",
        OPENAI_API_KEY: "PRIVATE_AI",
      }),
  });
  const commerce = createPartsSearchService({
    fetcher: async (input) => {
      const url = new URL(String(input));
      if (url.searchParams.get("engine") !== "google_shopping")
        return Response.json({ organic_results: [] });
      const title = (url.searchParams.get("q") || "Peça").replace(
        " comprar peça automotiva",
        "",
      );
      return Response.json({
        serpapi_pagination:
          state.commercialHasNext && url.searchParams.get("start") === "0"
            ? { next: "https://serpapi.com/search.json?start=20" }
            : {},
        shopping_results: state.noOffers
          ? []
          : [
              {
                title: title + " — anúncio A de teste",
                link: "https://loja.test-store.com.br/produto/a",
                source: "Loja A",
                brand: "Bosch",
                sku: "TEST-A",
                applications: ["Aplicação declarada para teste"],
                condition: "new",
                price: 100,
                currency: "BRL",
                shipping_price: 20,
                shipping_currency: "BRL",
                availability: "in_stock",
                thumbnail: "https://images.test-store.com.br/a.png",
              },
              {
                title: title + " — anúncio B de teste",
                link: "https://outra.test-store.com.br/produto/a",
                source: "Loja B",
                brand: "Bosch",
                sku: "TEST-A",
                applications: ["Aplicação declarada para teste"],
                condition: "new",
                price: 150,
                currency: "BRL",
                shipping_price: 0,
                shipping_currency: "BRL",
                availability: "in_stock",
                thumbnail: "https://images.test-store.com.br/b.png",
              },
              {
                title: title + " — anúncio C de teste",
                link: "https://terceira.test-store.com.br/produto/c",
                source: "Loja C",
                brand: "Denso",
                sku: "TEST-C",
                condition: "used",
                price: 90,
                currency: "BRL",
              },
            ],
      });
    },
  });
  const purchaseHandler = createPartsSearchHandler({
    search: (q) =>
      commerce.search(q, {
        PARTS_SERPAPI_KEY: "PRIVATE_COMMERCE",
        PARTS_PUBLIC_SEARCH_ENABLED: "false",
        PARTS_SEARCH_CACHE_SECONDS: "60",
      }),
  });
  const unified = createUnifiedHandler({
    technical: async (request) =>
      state.technicalFailure
        ? Response.json({ error: "cota" }, { status: 429 })
        : technicalHandler(request),
    commercial: async (request) => {
      state.queries.push(new URL(request.url).searchParams);
      return purchaseHandler(request);
    },
  });
  await page.route(/\/api\/automotive-search\/unified\?/, async (route) => {
    if (
      new URL(route.request().url()).searchParams.get("q") === "Consulta antiga"
    )
      await new Promise((resolve) => setTimeout(resolve, 500));
    const response = await unified(new Request(route.request().url()));
    try {
      await route.fulfill({
        status: response.status,
        contentType: response.headers.get("content-type") || "application/json",
        body: await response.text(),
      });
    } catch {
      /* aborted query */
    }
  });
  await page.route(/\/api\/automotive-search\?/, async (route) => {
    const response = await technicalHandler(new Request(route.request().url()));
    await route.fulfill({
      status: response.status,
      contentType: "application/json",
      body: await response.text(),
    });
  });
  await page.route("**/api/parts-search?**", async (route) => {
    const response = await purchaseHandler(new Request(route.request().url()));
    await route.fulfill({
      status: response.status,
      contentType: "application/json",
      body: await response.text(),
    });
  });
  const vehicles = createVehicleCatalog(async (input) => {
    const path = new URL(String(input)).pathname;
    if (path.endsWith("/anos/2026-1"))
      return Response.json({
        Modelo: "HB20 1.0 versão de teste",
        Combustivel: "Gasolina",
      });
    if (path.endsWith("/anos"))
      return Response.json([{ codigo: "2026-1", nome: "2026 Gasolina" }]);
    if (path.endsWith("/modelos"))
      return Response.json({
        modelos: [{ codigo: 7, nome: "HB20 1.0 versão de teste" }],
      });
    return Response.json([
      { codigo: 26, nome: "Hyundai" },
      { codigo: 21, nome: "Fiat" },
    ]);
  });
  await page.route("**/api/vehicle-catalog**", async (route) =>
    route.fulfill({
      json: await vehicles(new URL(route.request().url()).searchParams),
    }),
  );
  await page.route("https://images.test-store.com.br/**", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
  await page.route("https://www.youtube-nocookie.com/embed/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<p>Player controlado de teste</p>",
    }),
  );
  await page.route("https://images.openai.com/**", (route) => route.abort());
  return state;
}
