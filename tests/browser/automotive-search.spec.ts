import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  emptyInput,
  type SearchResponse,
  type SearchSource,
} from "../../src/lib/automotive-search/contracts";

const path = process.env.AUTOMOTIVE_PREVIEW_PATH || "/pesquisa-automotiva";
function fixture(query = "sensor map"): SearchResponse {
  const sources = [
    "web",
    "diagnosis",
    "diagram",
    "code",
    "manual",
    "video",
  ].map((kind, i): SearchSource => ({
    id: "S" + i,
    title: [
      "Sensor MAP: funcionamento",
      "Diagnóstico do sensor MAP",
      "Esquema do sensor MAP",
      "Código P0106",
      "Manual MAP",
      "Vídeo MAP",
    ][i],
    url:
      kind === "video"
        ? "https://www.youtube.com/watch?v=abcdefghijk"
        : "https://www.boschaftermarket.com/teste-" + kind,
    host: kind === "video" ? "www.youtube.com" : "www.boschaftermarket.com",
    snippet: "Trecho controlado de teste sobre pressão de admissão.",
    provider: kind === "video" ? "youtube" : "google-web",
    kind: kind as SearchSource["kind"],
    image: null,
    imagePage: null,
    published: null,
    score: 10,
  }));
  return {
    version: 1,
    query: { ...emptyInput, q: query },
    interpreted: {
      original: query,
      corrected: "sensor map",
      name: "Sensor MAP",
      aliases: ["Sensor de pressão absoluta"],
      intent: "part",
      suggestions: [],
    },
    status: "ready",
    sources,
    images: [
      {
        id: "I1",
        title: "MAP — imagem de teste",
        url: sources[0].url,
        page: sources[0].url,
        image: "https://images.fixture.test/map.png",
        provider: "google-image",
      },
    ],
    answer: {
      summary: "Síntese dos trechos encontrados.",
      facts: [
        {
          category: "function",
          text: "O sensor informa a pressão no coletor de admissão.",
          status: "general",
          sourceIds: ["S0"],
        },
      ],
      missing: ["Aplicação no veículo não confirmada."],
      related: ["Sensor MAP diagnóstico"],
    },
    ai: "ready",
    localReferences: [],
    providers: [{ id: "google-web", state: "ok" }],
    queriedAt: "2026-11-12T12:00:00Z",
    cached: false,
    storage: "memory",
  };
}
test.beforeEach(async ({ page }) => {
  await page.route("https://images.fixture.test/**", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
});
test("abas, citações, filtros, imagem com fonte e acessibilidade nos dois temas", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let params = new URLSearchParams();
  await page.route("**/api/automotive-search?**", (route) => {
    params = new URL(route.request().url()).searchParams;
    if (params.has("suggest"))
      return route.fulfill({ json: { suggestions: ["Sensor MAP"] } });
    return route.fulfill({ json: fixture(params.get("q") || "") });
  });
  await page.goto(path);
  const root = page.locator(".automotive-search");
  await root
    .getByLabel("Peça, sintoma ou pergunta automotiva")
    .fill("senso map");
  await expect(
    root.getByRole("button", { name: "Sensor MAP", exact: true }),
  ).toBeVisible();
  await root
    .getByText("Refinar veículo e fonte técnica", { exact: true })
    .click();
  await root.getByLabel("Montadora").fill("Hyundai");
  await root.getByLabel("Modelo", { exact: true }).fill("HB20");
  await root.getByLabel("Ano", { exact: true }).fill("2026");
  await root.getByLabel("Motor / versão").fill("1.0");
  await root.getByLabel("Fonte técnica (web)").selectOption("bosch");
  await root.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect(
    root.getByText("Pesquisa concluída", { exact: true }),
  ).toBeVisible();
  expect(params.get("brand")).toBe("Hyundai");
  expect(params.get("source")).toBe("bosch");
  await expect(page).toHaveURL(/auto_model=HB20/);
  await expect(root.locator(".auto-answer article a")).toHaveAttribute(
    "href",
    "https://www.boschaftermarket.com/teste-web",
  );
  await expect(
    root.getByText("Pesquisamos por", { exact: false }),
  ).toBeVisible();
  for (const [name, title] of [
    ["VÍDEOS", "Vídeo MAP"],
    ["DIAGNÓSTICO", "Diagnóstico do sensor MAP"],
    ["ESQUEMAS", "Esquema do sensor MAP"],
    ["CÓDIGOS", "Código P0106"],
    ["MANUAIS", "Manual MAP"],
  ]) {
    await root.getByRole("button", { name, exact: true }).click();
    await expect(root.locator(".auto-source")).toHaveCount(1);
    await expect(root.locator(".auto-source")).toContainText(title);
  }
  await root.getByRole("button", { name: "IMAGENS", exact: true }).click();
  await expect(root.locator(".auto-picture img")).toBeVisible();
  await expect(
    root.getByRole("link", { name: /fonte original/ }),
  ).toHaveAttribute("href", "https://www.boschaftermarket.com/teste-web");
  await root.getByRole("button", { name: "TODOS", exact: true }).click();
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (t) => (document.documentElement.dataset.theme = t),
      theme,
    );
    expect(
      (
        await new AxeBuilder({ page })
          .include(".automotive-search")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `test-results/automotive-${info.project.name}.png`,
  });
});
test("vazio, limite, erro recuperável e histórico local opcional", async ({
  page,
}) => {
  let mode = "empty";
  await page.route("**/api/automotive-search?**", (route) => {
    if (new URL(route.request().url()).searchParams.has("suggest"))
      return route.fulfill({ json: { suggestions: [] } });
    if (mode === "error")
      return route.fulfill({
        status: 429,
        json: { error: "Limite temporário. Tente novamente." },
      });
    const result = fixture();
    if (mode === "empty")
      Object.assign(result, {
        sources: [],
        images: [],
        answer: null,
        status: "empty",
        ai: "no_evidence",
      });
    else
      Object.assign(result, {
        status: "partial",
        providers: [{ id: "google-web", state: "limited" }],
      });
    return route.fulfill({ json: result });
  });
  await page.goto(path);
  const root = page.locator(".automotive-search");
  await root.getByRole("button", { name: "P0106", exact: true }).click();
  await expect(
    root.getByText("Nenhum resultado encontrado", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("edson-auto-history")),
  ).toBeNull();
  mode = "error";
  await root.getByRole("button", { name: "P0106", exact: true }).click();
  await expect(root.getByRole("alert")).toContainText("Limite temporário");
  mode = "partial";
  await root.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    root.getByText("Uma das fontes atingiu seu limite", { exact: false }),
  ).toBeVisible();
  await root.getByText("Histórico de pesquisas", { exact: true }).click();
  await root.getByLabel("Guardar pesquisas neste navegador").check();
  await root.getByRole("button", { name: "P0106", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("edson-auto-history")))
    .not.toBeNull();
  await root.getByRole("button", { name: "Limpar histórico local" }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("edson-auto-history")),
  ).toBeNull();
  await page.route("**/api/automotive-search/history", (route) =>
    route.fulfill({
      status: 401,
      json: { error: "Entre na conta para consultar seu histórico." },
    }),
  );
  await root.getByRole("button", { name: "Histórico da minha conta" }).click();
  await expect(root.getByRole("status")).toContainText("Entre na conta");
});
test("endpoint real sem credenciais e sugestões locais", async ({
  request,
}) => {
  // O teste independe de Prisma: sem credenciais não há cobrança nem acesso ao banco.
  const suggestions = await request.get(
    "/api/automotive-search?suggest=1&q=map",
  );
  expect(suggestions.status()).toBe(200);
  expect((await suggestions.json()).suggestions.length).toBeGreaterThan(0);
  const response = await request.get("/api/automotive-search?q=sensor%20map");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe("not_configured");
  expect(body.answer).toBeNull();
  expect(body.sources).toEqual([]);
  expect(body.localReferences.length).toBeGreaterThan(0);
});

test("consulta sem API apresenta limite real e preserva biblioteca e ofertas", async ({
  page,
}) => {
  await page.goto(path);
  const root = page.locator(".automotive-search");
  await root
    .getByLabel("Peça, sintoma ou pergunta automotiva")
    .fill("sensor MAP");
  await root.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect(
    root.getByText("Pesquisa externa ainda não configurada", { exact: true }),
  ).toBeVisible();
  await expect(
    root.getByRole("heading", { name: "Biblioteca técnica do portal" }),
  ).toBeVisible();
  await expect(root.locator(".auto-source")).toHaveCount(0);
  await expect(
    root.getByRole("link", { name: /Comparar ofertas de peças/ }),
  ).toHaveAttribute("href", "/pecas#ofertas-de-pecas");
});
