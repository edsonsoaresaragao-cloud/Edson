import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { createPartsSearchService } from "../../src/lib/parts/service";
import { createPartsSearchHandler } from "../../src/lib/parts/handler";
import fixture from "../fixtures/parts-search.json" with { type: "json" };
import {
  partsQuerySchema,
  type PartsResult,
} from "../../src/lib/parts/catalog";
import {
  providerJobs,
  parseProviderPage,
  mergeOffers,
} from "../../src/lib/parts/providers";
const path = process.env.PARTS_PREVIEW_PATH || "/pecas";
const q = partsQuerySchema.parse({ q: "Pastilha", code: "TEST-123" }),
  jobs = providerJobs("Pastilha", 1, { PARTS_SERPAPI_KEY: "fixture" });
const offers = mergeOffers([
  ...parseProviderPage(fixture.shopping, jobs[0], q).offers,
  ...parseProviderPage(fixture.web, jobs[1], q).offers,
]);
function result(overrides: Partial<PartsResult> = {}): PartsResult {
  return {
    status: "ready",
    offers,
    sources: [
      { id: "shopping", label: "Google Shopping", state: "ok" },
      { id: "web", label: "Google Web", state: "ok" },
    ],
    query: "Pastilha TEST-123",
    queriedAt: "2026-11-02T12:00:00Z",
    page: 1,
    hasNext: true,
    cached: false,
    ...overrides,
  };
}
test.beforeEach(async ({ page }) => {
  await page.route("https://images.openai.com/**", (route) => route.abort());
  await page.route("https://images.test-store.com.br/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
});
test("pesquisa, ordenação, filtros, paginação e acessibilidade", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/parts-search?**", (route) => {
    const p = new URL(route.request().url()).searchParams;
    const pageNumber = Number(p.get("page") || 1);
    return route.fulfill({
      json: result({ page: pageNumber, hasNext: pageNumber === 1 }),
    });
  });
  await page.goto(path);
  const root = page.locator(".parts-marketplace");
  await root.getByLabel("Peça ou código para pesquisar").fill("Pastilha");
  await root.getByLabel("Código da peça / OEM").fill("TEST-123");
  await root.getByRole("button", { name: "Buscar ofertas" }).click();
  await expect(root.locator(".parts-offer")).toHaveCount(3);
  await expect(page).toHaveURL(/buy=Pastilha/);
  await root.getByLabel("Ordenar").selectOption("high");
  await expect(root.locator(".parts-offer").first()).toContainText(
    "Bobina de teste",
  );
  await root.getByLabel("Com foto na fonte").check();
  await expect(root.locator(".parts-offer")).toHaveCount(2);
  await root.getByLabel("Loja nesta página").selectOption("Loja de Teste");
  await expect(root.locator(".parts-offer")).toHaveCount(1);
  await expect(root.locator(".parts-offer a")).toHaveAttribute(
    "href",
    "https://loja.test-store.com.br/produto/pastilha",
  );
  await root.getByLabel("Loja nesta página").selectOption("all");
  await root.getByRole("button", { name: "Página seguinte" }).click();
  await expect(root.locator(".parts-pagination")).toContainText("Página 2");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const accessibility = await new AxeBuilder({ page })
    .include(".parts-marketplace")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    accessibility.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page
    .getByRole("button", { name: "Alternar tema claro e escuro" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const dark = await new AxeBuilder({ page })
    .include(".parts-marketplace")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    dark.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `test-results/parts-${info.project.name}.png`,
    fullPage: true,
  });
  await root.getByRole("button", { name: "Limpar busca de ofertas" }).click();
  await expect(root.locator(".parts-offer")).toHaveCount(0);
  await expect(root.getByLabel("Peça ou código para pesquisar")).toHaveValue(
    "",
  );
  await expect(page).not.toHaveURL(/buy=/);
});
test("falha das fontes mantém referência visual MAF e busca completa nas lojas", async ({
  page,
}, info) => {
  const completed = Promise.withResolvers<void>();
  await page.route("**/api/parts-search?**", async (route) => {
    await completed.promise;
    return route.fulfill({
      status: 503,
      json: result({
        status: "unavailable",
        publicSearch: true,
        offers: [],
        sources: [],
        hasNext: false,
      }),
    });
  });
  await page.goto(path);
  const root = page.locator(".parts-marketplace");
  await root.getByLabel("Peça ou código para pesquisar").fill("senso maf");
  await root.getByLabel("Marca do veículo").fill("chevrolet");
  await root.getByLabel("Modelo", { exact: true }).fill("onix");
  await root.getByLabel("Ano", { exact: true }).fill("2022");
  await root.getByLabel("Motor / versão").fill("1.0");
  await root.getByRole("button", { name: "Buscar ofertas" }).click();
  await expect(root.locator(".parts-reference-card")).toHaveCount(1);
  await expect(
    root.getByRole("heading", { name: "Sensor MAF", exact: true }),
  ).toBeVisible();
  await expect(
    root.getByText("Esta ficha não é um anúncio", { exact: false }),
  ).toBeVisible();
  completed.resolve();
  await expect(
    root.getByRole("heading", {
      name: "As fontes estão indisponíveis no momento",
    }),
  ).toBeVisible();
  await expect(root.locator(".parts-offer")).toHaveCount(0);
  await expect(
    root.getByRole("link", { name: "Mercado Livre", exact: true }),
  ).toHaveAttribute("href", /sensor-maf-chevrolet-onix-2022-1.0/);
  await expect(root.locator(".parts-reference-card figcaption")).toHaveText(
    "Ilustração didática gerada",
  );
  await expect(
    root.getByRole("link", { name: "Buscar esta peça no Mercado Livre" }),
  ).toHaveAttribute("href", /sensor-maf-chevrolet-onix-2022-1.0/);
  const accessibility = await new AxeBuilder({ page })
    .include(".parts-marketplace")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    accessibility.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  await page.screenshot({
    path: `test-results/parts-maf-reference-${info.project.name}.png`,
    fullPage: true,
  });
  await root.getByRole("button", { name: "Limpar busca de ofertas" }).click();
  await expect(root.locator(".parts-reference-card")).toHaveCount(0);
});

test("consulta pública sem chave atravessa serviço, handler e interface", async ({
  page,
}, info) => {
  const rss = readFileSync("tests/fixtures/parts-public-search.rss", "utf8");
  const html = readFileSync("tests/fixtures/parts-public-search.html", "utf8");
  const product = readFileSync(
    "tests/fixtures/parts-merchant-product.html",
    "utf8",
  );
  const service = createPartsSearchService({
    fetcher: async (input) => {
      const host = new URL(String(input)).hostname;
      if (host === "www.bing.com") return new Response(rss);
      if (host === "html.duckduckgo.com") return new Response(html);
      if (host === "www.karhub.com.br")
        return new Response(product, {
          headers: { "content-type": "text/html" },
        });
      throw new Error("unexpected fixture destination");
    },
  });
  const handler = createPartsSearchHandler({
    search: (query) => service.search(query, {}),
  });
  await page.route("**/api/parts-search?**", async (route) => {
    const response = await handler(new Request(route.request().url()));
    return route.fulfill({
      status: response.status,
      contentType: "application/json",
      body: await response.text(),
    });
  });
  await page.goto(path);
  const root = page.locator(".parts-marketplace");
  await root.getByLabel("Peça ou código para pesquisar").fill("senso maf");
  await root.getByLabel("Marca do veículo").fill("chevrolet");
  await root.getByLabel("Modelo", { exact: true }).fill("onix");
  await root.getByLabel("Ano", { exact: true }).fill("2022");
  await root.getByLabel("Motor / versão").fill("1.0");
  await root.getByRole("button", { name: "Buscar ofertas" }).click();
  await expect(root.locator(".parts-offer")).toHaveCount(2);
  await expect(root.locator(".parts-offer").first()).toContainText("R$ 249,90");
  await expect(root.locator(".parts-source-list")).toContainText(
    "Bing · páginas públicas",
  );
  await expect(
    root.getByText("Pesquisando por “sensor maf”", { exact: false }),
  ).toBeVisible();
  await expect(
    root
      .locator(".parts-offer")
      .first()
      .getByRole("link", { name: "VER OFERTA / COMPRAR" }),
  ).toHaveAttribute("href", "https://www.karhub.com.br/sensor-maf-fixture/p");
  await expect(
    root.locator(".parts-offer").first().locator("img"),
  ).toBeVisible();
  await expect(root.locator(".parts-reference-card")).toHaveCount(0);
  await page.screenshot({
    path: `test-results/parts-maf-public-${info.project.name}.png`,
    fullPage: true,
  });
});
test("consulta antiga não substitui a pesquisa mais recente", async ({
  page,
}) => {
  await page.route("**/api/parts-search?**", async (route) => {
    const term = new URL(route.request().url()).searchParams.get("q");
    if (term === "Consulta antiga")
      await new Promise((resolve) => setTimeout(resolve, 500));
    const updated = offers.map((o) => ({
      ...o,
      title: term === "Consulta nova" ? "Resultado da consulta nova" : o.title,
    }));
    try {
      await route.fulfill({
        json: result({ offers: updated, query: term || "" }),
      });
    } catch {
      /* The old fetch may be aborted by the browser. */
    }
  });
  await page.goto(path);
  const root = page.locator(".parts-marketplace");
  await root
    .getByLabel("Peça ou código para pesquisar")
    .fill("Consulta antiga");
  const old = page.waitForRequest(
    (r) =>
      r.url().includes("/api/parts-search") &&
      r.url().includes("Consulta+antiga"),
  );
  await root.getByRole("button", { name: "Buscar ofertas" }).click();
  await old;
  await root.getByLabel("Peça ou código para pesquisar").fill("Consulta nova");
  await root.getByRole("button", { name: "Buscar ofertas" }).click();
  await expect(root.locator(".parts-offer").first()).toContainText(
    "Resultado da consulta nova",
  );
  await page.waitForTimeout(650);
  await expect(root.locator(".parts-offer").first()).toContainText(
    "Resultado da consulta nova",
  );
});
