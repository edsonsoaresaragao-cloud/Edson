import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { installIntelligentFixture } from "../fixtures/intelligent-search";
import { createPartsSearchService } from "../../src/lib/parts/service";
import { createPartsSearchHandler } from "../../src/lib/parts/handler";
import { createAutomotiveSearch } from "../../src/lib/automotive-search/service";
import { createSearchHandler } from "../../src/lib/automotive-search/handler";
import { createUnifiedHandler } from "../../src/lib/automotive-search/unified";

test("ofertas mantêm ordenação, filtros e paginação sem repetir a pesquisa técnica", async ({
  page,
}) => {
  const state = await installIntelligentFixture(page);
  state.commercialHasNext = true;
  await page.goto("/pecas");
  const root = page.locator(".automotive-search");
  await root
    .getByLabel("O que você procura para seu veículo?")
    .fill("Comprar pastilha de freio");
  await root.getByRole("button", { name: "Pesquisar", exact: true }).click();
  const parts = root.locator(".parts-marketplace");
  await expect(parts.locator(".parts-offer")).toHaveCount(3);
  await parts.getByLabel("Ordenar").selectOption("high");
  await expect(parts.locator(".parts-offer").first()).toContainText("Loja B");
  await parts.getByLabel("Com foto na fonte").check();
  await expect(parts.locator(".parts-offer")).toHaveCount(2);
  await parts.getByLabel("Loja nesta página").selectOption("Loja A");
  await expect(parts.locator(".parts-offer")).toHaveCount(1);
  await expect(
    parts
      .locator(".parts-offer")
      .getByRole("link", { name: "VER OFERTA / COMPRAR" }),
  ).toHaveAttribute("href", "https://loja.test-store.com.br/produto/a");
  await parts.getByLabel("Loja nesta página").selectOption("all");
  const next = page.waitForRequest(
    (r) =>
      r.url().includes("/unified?") &&
      new URL(r.url()).searchParams.get("offerPage") === "2",
  );
  await parts.getByRole("button", { name: "Página seguinte" }).click();
  const request = await next;
  expect(new URL(request.url()).searchParams.get("scope")).toBe("commercial");
  await expect(parts.locator(".parts-pagination")).toContainText("Página 2");
  await expect(page).toHaveURL(/buyPage=2/);
  await parts.getByRole("button", { name: "Página anterior" }).click();
  await expect(parts.locator(".parts-pagination")).toContainText("Página 1");
});

test("fallback público explicitamente autorizado conserva produto, preço e foto reais da fonte", async ({
  page,
}) => {
  const rss = readFileSync("tests/fixtures/parts-public-search.rss", "utf8"),
    html = readFileSync("tests/fixtures/parts-public-search.html", "utf8"),
    product = readFileSync(
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
      throw new Error("unexpected fixture source");
    },
  });
  const technical = createAutomotiveSearch();
  const handler = createUnifiedHandler({
    technical: createSearchHandler({
      guard: async () => {},
      search: (q) => technical(q, {}),
    }),
    commercial: createPartsSearchHandler({
      search: (q) => service.search(q, { PARTS_PUBLIC_SEARCH_ENABLED: "true" }),
    }),
  });
  await page.route(/\/api\/automotive-search\/unified\?/, async (route) => {
    const response = await handler(new Request(route.request().url()));
    await route.fulfill({
      status: response.status,
      contentType: response.headers.get("content-type") || "application/json",
      body: await response.text(),
    });
  });
  await page.route("**/api/vehicle-catalog**", (r) =>
    r.fulfill({ json: { options: [] } }),
  );
  await page.route("https://www.karhub.com.br/**", (r) =>
    r.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
  await page.goto("/pecas");
  const root = page.locator(".automotive-search"),
    form = root.locator("form");
  await form
    .getByLabel("O que você procura para seu veículo?")
    .fill("senso maf");
  await form
    .getByText("Refinar veículo e fonte técnica", { exact: true })
    .click();
  await form.getByLabel("Marca do veículo").fill("chevrolet");
  await form.getByLabel("Modelo", { exact: true }).fill("onix");
  await form.getByLabel("Ano", { exact: true }).fill("2022");
  await form.getByLabel("Motor / versão").fill("1.0");
  await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await root.getByRole("tab", { name: /^PEÇAS/ }).click();
  const parts = root.locator(".parts-marketplace");
  await expect(parts.locator(".parts-offer")).toHaveCount(2);
  await expect(parts.locator(".parts-offer").first()).toContainText(
    "R$ 249,90",
  );
  await expect(parts.locator(".parts-source-list")).toContainText(
    "Bing · páginas públicas",
  );
  await expect(
    parts
      .locator(".parts-offer")
      .first()
      .getByRole("link", { name: "VER OFERTA / COMPRAR" }),
  ).toHaveAttribute("href", "https://www.karhub.com.br/sensor-maf-fixture/p");
  await expect(parts.locator(".parts-reference-card")).toHaveCount(0);
  await expect(
    parts.getByRole("link", { name: "Mercado Livre", exact: true }),
  ).toHaveAttribute("href", /sensor-maf-chevrolet-onix-2022-1.0/);
});
