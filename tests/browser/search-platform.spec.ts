import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installIntelligentFixture } from "../fixtures/intelligent-search";
const path = "/pecas";
const searchLabel = "O que você procura para seu veículo?";

test("busca única, filtros dependentes, oito abas, ofertas e mídia", async ({
  page,
}, info) => {
  const state = await installIntelligentFixture(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(path);
  const root = page.locator(".automotive-search"),
    form = root.locator("form");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Buscador Inteligente de Peças e Soluções Automotivas",
    }),
  ).toBeVisible();
  await expect(root.locator("form")).toHaveCount(1);
  await expect(
    page.getByText("Entenda a peça antes de escolher.", { exact: true }),
  ).toHaveCount(0);
  await form.getByLabel(searchLabel).fill("Comprar alternador");
  await form
    .getByText("Refinar veículo e fonte técnica", { exact: true })
    .click();
  await form.getByLabel("Marca do veículo").fill("Hyundai");
  await expect
    .poll(() => form.locator("datalist").nth(1).locator("option").count())
    .toBe(1);
  await form
    .getByLabel("Modelo", { exact: true })
    .fill("HB20 1.0 versão de teste");
  await expect
    .poll(() => form.locator("datalist").nth(2).locator("option").count())
    .toBe(1);
  await form.getByLabel("Ano", { exact: true }).fill("2026");
  await expect
    .poll(() => form.locator("datalist").nth(3).locator("option").count())
    .toBe(1);
  await form
    .getByLabel("Motor / versão")
    .fill("HB20 1.0 versão de teste · Gasolina");
  await form.getByLabel("Código da peça informado").fill("TEST-OEM");
  await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
  const parts = root.locator(".parts-marketplace");
  await expect(parts.locator(".parts-offer")).toHaveCount(3);
  await expect(root.getByRole("tab", { name: /^PEÇAS/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(root.getByRole("tab")).toHaveCount(8);
  expect(
    (await root.getByRole("tab").allTextContents()).map((v) =>
      v.replace(/\d+$/, "").trim(),
    ),
  ).toEqual([
    "PEÇAS",
    "TODOS",
    "IMAGENS",
    "VÍDEOS",
    "DIAGNÓSTICO",
    "ESQUEMAS",
    "CÓDIGOS",
    "MANUAIS",
  ]);
  await expect(root.locator("form")).toHaveCount(1);
  expect(Object.fromEntries(state.queries.at(-1)!)).toMatchObject({
    q: "alternador",
    brand: "Hyundai",
    model: "HB20 1.0 versão de teste",
    year: "2026",
    code: "TEST-OEM",
  });
  await expect(parts.locator(".parts-offer").first()).toContainText(
    "Declarada pelo vendedor; não verificada",
  );
  await expect(parts.locator(".parts-offer").first()).toContainText(
    "R$ 120,00",
  );
  await expect(parts.locator(".parts-comparable")).toHaveCount(1);
  await expect(
    parts
      .locator(".parts-offer")
      .first()
      .getByRole("link", { name: "VER OFERTA / COMPRAR" }),
  ).toHaveAttribute("href", "https://loja.test-store.com.br/produto/a");
  await parts.getByLabel("Ordenar").selectOption("total");
  await expect(parts.locator(".parts-offer").first()).toContainText("Loja A");
  await parts.getByLabel("Condição").selectOption("used");
  await expect(parts.locator(".parts-offer")).toHaveCount(1);
  await parts.getByLabel("Condição").selectOption("all");
  await parts.getByLabel("Preço máximo (R$)").fill("110");
  await expect(parts.locator(".parts-offer")).toHaveCount(2);
  const calls = state.queries.length;
  for (const name of [
    "TODOS",
    "IMAGENS",
    "VÍDEOS",
    "DIAGNÓSTICO",
    "ESQUEMAS",
    "CÓDIGOS",
    "MANUAIS",
    "PEÇAS",
  ]) {
    await root.getByRole("tab", { name: new RegExp("^" + name) }).click();
    await expect(form.getByLabel("Marca do veículo")).toHaveValue("Hyundai");
    await expect(root.getByRole("tabpanel")).toHaveCount(1);
  }
  expect(state.queries.length).toBe(calls);
  await expect(parts.getByLabel("Preço máximo (R$)")).toHaveValue("110");
  await parts.getByLabel("Preço máximo (R$)").fill("");
  await parts.getByLabel("Somente compatibilidade confirmada").check();
  await expect(parts.locator(".parts-offer")).toHaveCount(0);
  await parts.getByLabel("Somente compatibilidade confirmada").uncheck();
  await root.getByRole("tab", { name: /^IMAGENS/ }).click();
  await root.getByLabel("Tipo de imagem").selectOption("photo");
  await expect(root.locator(".auto-picture > button")).toHaveCount(1);
  await root.getByRole("button", { name: /Ampliar:/ }).click();
  await expect(root.locator("dialog[open]")).toBeVisible();
  await root.getByRole("button", { name: "Fechar imagem" }).click();
  await root.getByRole("tab", { name: /^VÍDEOS/ }).click();
  await expect(root.locator(".auto-source")).toContainText("Canal de teste");
  await root.getByRole("button", { name: "Reproduzir vídeo" }).click();
  await expect(root.locator("iframe")).toHaveAttribute(
    "src",
    "https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1",
  );
  await root.getByRole("tab", { name: /^DIAGNÓSTICO/ }).click();
  await expect(root.locator(".auto-diagnostic h4")).toHaveCount(9);
  await expect(root.locator(".auto-diagnostic")).toContainText("scanner");
  await expect(root.locator(".auto-diagnostic")).toContainText(
    "Não informado nas fontes",
  );
  await root.getByRole("tab", { name: /^MANUAIS/ }).click();
  await expect(root.locator(".auto-source")).toContainText("PDF");
  await root.getByRole("tab", { name: /^PEÇAS/ }).click();
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (t) => (document.documentElement.dataset.theme = t),
      theme,
    );
    const report = await new AxeBuilder({ page })
      .include(".automotive-search")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      report.violations.map((v) => ({
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
    path: `test-results/final-search-${info.project.name}.png`,
  });
  await root.getByRole("tab", { name: /^PEÇAS/ }).focus();
  await page.keyboard.press("End");
  await expect(root.getByRole("tab", { name: /^MANUAIS/ })).toBeFocused();
});

test("sem veículo, nome popular, OEM sozinho, sintoma, DTC e URL compartilhável", async ({
  page,
}) => {
  const state = await installIntelligentFixture(page);
  await page.goto(path);
  const root = page.locator(".automotive-search"),
    form = root.locator("form");
  for (const q of [
    "senso MAP",
    "Bobina de ignição",
    "Alternador não carrega",
    "P0106 Onix 2024",
  ]) {
    await form.getByLabel(searchLabel).fill(q);
    await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
    await expect(
      root.getByText("Informações técnicas encontradas", { exact: true }),
    ).toBeVisible();
    if (q === "senso MAP")
      expect(state.queries.at(-1)!.get("q")).toBe("sensor MAP");
    if (q === "Alternador não carrega") {
      await expect(
        root.getByRole("tab", { name: /^DIAGNÓSTICO/ }),
      ).toHaveAttribute("aria-selected", "true");
      expect(state.queries.at(-1)!.get("q")).toBe("Alternador");
    }
    if (q.startsWith("P0106")) {
      await expect(root.getByRole("tab", { name: /^CÓDIGOS/ })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(root.locator(".auto-diagnostic")).toContainText(
        "estrutura padronizada",
      );
    }
  }
  await form
    .getByText("Refinar veículo e fonte técnica", { exact: true })
    .click();
  await form.getByLabel(searchLabel).fill("");
  await form.getByLabel("Código da peça informado").fill("OEM-123");
  await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect.poll(() => state.queries.at(-1)?.get("code")).toBe("OEM-123");
  await expect(form.getByLabel(searchLabel)).toHaveValue("OEM-123");
  await page.reload();
  await expect(form.getByLabel("Código da peça informado")).toHaveValue(
    "OEM-123",
  );
});

test("falha parcial, vazio, catálogo manual e cancelamento preservam os dados válidos", async ({
  page,
}) => {
  const state = await installIntelligentFixture(page);
  state.imageFailure = true;
  await page.route("**/api/vehicle-catalog**", (route) =>
    route.fulfill({ status: 503, json: { options: [] } }),
  );
  await page.goto(path);
  const root = page.locator(".automotive-search"),
    form = root.locator("form");
  await form
    .getByText("Refinar veículo e fonte técnica", { exact: true })
    .click();
  await expect(root.locator(".auto-catalog-note")).toContainText("manualmente");
  await form.getByLabel("Marca do veículo").fill("Toyota");
  await form.getByLabel("Modelo", { exact: true }).fill("Corolla");
  await form.getByLabel(searchLabel).fill("Alternador");
  await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect(
    root.getByText("Pesquisa com informações parciais", { exact: true }),
  ).toBeVisible();
  await expect(root.locator(".parts-offer")).toHaveCount(3);
  const commercialCalls = state.queries.length;
  await root
    .getByRole("button", { name: "Atualizar informações técnicas" })
    .click();
  await expect(
    root.getByText("Pesquisa com informações parciais", { exact: true }),
  ).toBeVisible();
  expect(state.queries.length).toBe(commercialCalls);
  state.technicalFailure = true;
  state.noOffers = true;
  await form.getByLabel(searchLabel).fill("Peça sem anúncios");
  await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect(root.getByRole("alert")).toContainText("Limite");
  await expect(
    root.getByRole("heading", {
      name: "Não encontramos ofertas verificadas para esta pesquisa. Confira o código da peça ou refine o veículo.",
    }),
  ).toBeVisible();
  state.technicalFailure = false;
  state.noOffers = false;
  await form.getByLabel(searchLabel).fill("Consulta antiga");
  const old = page.waitForRequest(
    (r) =>
      r.url().includes("/unified?") &&
      new URL(r.url()).searchParams.get("q") === "Consulta antiga",
  );
  await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await old;
  await form.getByLabel(searchLabel).fill("Consulta nova");
  await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect(root.locator(".parts-offer").first()).toContainText(
    "Consulta nova",
  );
  await page.waitForTimeout(650);
  await expect(root.locator(".parts-offer").first()).toContainText(
    "Consulta nova",
  );
  await root
    .getByRole("button", { name: "Limpar pesquisa", exact: true })
    .click();
  await expect(root.getByRole("tab")).toHaveCount(0);
  await expect(form.getByLabel(searchLabel)).toHaveValue("");
  await expect(page).not.toHaveURL(/auto=/);
});

test("histórico é opcional e configuração ausente não vira anúncio", async ({
  page,
}) => {
  await page.route("**/api/vehicle-catalog**", (route) =>
    route.fulfill({ json: { options: [] } }),
  );
  await page.goto(path);
  const root = page.locator(".automotive-search");
  await root.getByRole("button", { name: "P0106", exact: true }).click();
  await expect(
    root.getByText("Pesquisa externa ainda não configurada", { exact: true }),
  ).toBeVisible();
  await expect(root.locator(".parts-offer")).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("edson-auto-history")),
  ).toBeNull();
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
});
