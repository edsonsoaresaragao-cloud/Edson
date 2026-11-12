import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installIntelligentFixture } from "../fixtures/intelligent-search";
const path = process.env.AUTOMOTIVE_PREVIEW_PATH || "/pesquisa-automotiva";

test("oito abas, catálogo dependente, comparação, compra, mídia e acessibilidade", async ({
  page,
}, info) => {
  const state = await installIntelligentFixture(page);
  await page.goto(path);
  const root = page.locator(".automotive-search"),
    form = root.locator("form").first();
  await expect(root.getByRole("tab")).toHaveCount(8);
  expect(await root.getByRole("tab").allTextContents()).toEqual([
    "PEÇAS",
    "TODOS",
    "IMAGENS",
    "VÍDEOS",
    "DIAGNÓSTICO",
    "ESQUEMAS",
    "CÓDIGOS",
    "MANUAIS",
  ]);
  await form
    .getByLabel("Peça, sintoma ou pergunta automotiva")
    .fill("Comprar alternador");
  await form
    .getByText("Refinar veículo e fonte técnica", { exact: true })
    .click();
  await form.getByLabel("Montadora").fill("Hyundai");
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
  await form.getByLabel("Código da peça informado").fill("OEM-TESTE");
  await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
  const offers = root.locator(".parts-marketplace");
  await expect(root.getByRole("tab", { name: /^PEÇAS/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(offers.locator(".parts-offer")).toHaveCount(3);
  expect(Object.fromEntries(state.queries.at(-1)!)).toMatchObject({
    q: "alternador",
    brand: "Hyundai",
    model: "HB20 1.0 versão de teste",
    year: "2026",
    engine: "HB20 1.0 versão de teste · Gasolina",
    code: "OEM-TESTE",
  });
  await expect(offers.locator(".parts-comparable")).toHaveCount(1);
  await expect(offers.locator(".parts-offer").first()).toContainText(
    "Declarada pelo vendedor; não verificada",
  );
  await expect(offers.locator(".parts-offer").first()).toContainText(
    "R$ 120,00",
  );
  await expect(
    offers
      .locator(".parts-offer")
      .first()
      .getByRole("link", { name: "VER OFERTA / COMPRAR" }),
  ).toHaveAttribute("href", "https://loja.test-store.com.br/produto/a");
  await offers.getByLabel("Ordenar").selectOption("total");
  await expect(offers.locator(".parts-offer").first()).toContainText("Loja A");
  await offers.getByLabel("Condição").selectOption("used");
  await expect(offers.locator(".parts-offer")).toHaveCount(1);
  await offers.getByLabel("Condição").selectOption("all");
  await offers.getByLabel("Preço máximo (R$)").fill("110");
  await expect(offers.locator(".parts-offer")).toHaveCount(2);
  await offers.getByLabel("Preço máximo (R$)").fill("");
  await offers.getByLabel("Somente compatibilidade confirmada").check();
  await expect(offers.locator(".parts-offer")).toHaveCount(0);
  await offers.getByLabel("Somente compatibilidade confirmada").uncheck();
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
    await expect(root.getByRole("tabpanel")).toHaveCount(1);
    await expect(form.getByLabel("Montadora")).toHaveValue("Hyundai");
  }
  expect(state.queries.length).toBe(calls);
  await root.getByRole("tab", { name: /^IMAGENS/ }).click();
  await root
    .getByRole("button", { name: /Ampliar:/ })
    .first()
    .click();
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
  await expect(root.locator(".auto-answer")).toContainText(
    "Sequência de verificações",
  );
  await expect(root.locator(".auto-answer")).toContainText("scanner");
  await root.getByRole("tab", { name: /^MANUAIS/ }).click();
  await expect(root.locator(".auto-source")).toContainText("PDF");
  await root.getByRole("tab", { name: /^PEÇAS/ }).click();
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (t) => (document.documentElement.dataset.theme = t),
      theme,
    );
    const axe = await new AxeBuilder({ page })
      .include(".automotive-search")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      axe.violations.map((v) => ({
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
  await page.screenshot({
    path: `test-results/intelligent-parts-${info.project.name}.png`,
  });
  await root.getByRole("tab", { name: /^PEÇAS/ }).focus();
  await page.keyboard.press("End");
  await expect(root.getByRole("tab", { name: /^MANUAIS/ })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(root.getByRole("tab", { name: /^PEÇAS/ })).toBeFocused();
});

test("peça sem veículo, OEM, sintoma, DTC e persistência na URL", async ({
  page,
}) => {
  const state = await installIntelligentFixture(page);
  await page.goto(path);
  const root = page.locator(".automotive-search"),
    form = root.locator("form").first();
  for (const q of [
    "Sensor MAP",
    "Bobina de ignição",
    "Alternador não carrega",
    "P0106",
  ]) {
    await form.getByLabel("Peça, sintoma ou pergunta automotiva").fill(q);
    await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp("auto=" + encodeURIComponent(q).replace(/%20/g, "\\+")),
    );
    await expect(
      root.getByText("Pesquisa concluída", { exact: true }),
    ).toBeVisible();
    if (q === "Alternador não carrega") {
      expect(state.queries.at(-1)!.get("q")).toBe("Alternador");
      await expect(
        root.getByRole("tab", { name: /^DIAGNÓSTICO/ }),
      ).toHaveAttribute("aria-selected", "true");
    }
    if (q === "P0106") {
      await expect(root.getByRole("tab", { name: /^CÓDIGOS/ })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(root.locator(".auto-answer")).toContainText(
        "estrutura padronizada",
      );
    }
  }
  await form
    .getByLabel("Peça, sintoma ou pergunta automotiva")
    .fill("OEM TEST-123");
  await form
    .getByText("Refinar veículo e fonte técnica", { exact: true })
    .click();
  await form.getByLabel("Código da peça informado").fill("TEST-123");
  await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect.poll(() => state.queries.at(-1)!.get("code")).toBe("TEST-123");
  await page.reload();
  await expect(form.getByLabel("Código da peça informado")).toHaveValue(
    "TEST-123",
  );
  await expect(
    form.getByLabel("Peça, sintoma ou pergunta automotiva"),
  ).toHaveValue("OEM TEST-123");
});

test("falhas parciais, nenhuma oferta e consulta antiga não substitui a nova", async ({
  page,
}) => {
  const state = await installIntelligentFixture(page);
  state.imageFailure = true;
  await page.goto(path);
  const root = page.locator(".automotive-search"),
    form = root.locator("form").first();
  await form
    .getByLabel("Peça, sintoma ou pergunta automotiva")
    .fill("Alternador");
  await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect(
    root.getByText("Pesquisa com informações parciais", { exact: true }),
  ).toBeVisible();
  await expect(root.locator(".parts-offer")).toHaveCount(3);
  state.technicalFailure = true;
  state.noOffers = true;
  await form
    .getByLabel("Peça, sintoma ou pergunta automotiva")
    .fill("Peça sem anúncios");
  await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect(root.getByRole("alert")).toContainText("Limite de consultas");
  await expect(
    root.getByRole("heading", {
      name: "Nenhuma oferta foi retornada para estes termos.",
    }),
  ).toBeVisible();
  state.technicalFailure = false;
  state.noOffers = false;
  await form
    .getByLabel("Peça, sintoma ou pergunta automotiva")
    .fill("Consulta antiga");
  const old = page.waitForRequest(
    (r) =>
      r.url().includes("/unified?") &&
      new URL(r.url()).searchParams.get("q") === "Consulta antiga",
  );
  await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await old;
  await root
    .getByRole("button", { name: "Bobina de ignição", exact: true })
    .first()
    .click();
  await expect(root.locator(".parts-offer").first()).toContainText(
    "Bobina de ignição",
  );
  await page.waitForTimeout(650);
  await expect(root.locator(".parts-offer").first()).toContainText(
    "Bobina de ignição",
  );
});

test("OEM sem nome de peça e catálogo indisponível mantêm pesquisa utilizável", async ({
  page,
}) => {
  const state = await installIntelligentFixture(page);
  await page.route("**/api/vehicle-catalog**", (route) =>
    route.fulfill({
      status: 503,
      json: { options: [], error: "Catálogo indisponível" },
    }),
  );
  await page.goto(path);
  const root = page.locator(".automotive-search"),
    form = root.locator("form").first();
  await form
    .getByText("Refinar veículo e fonte técnica", { exact: true })
    .click();
  await expect(root.locator(".auto-catalog-note")).toContainText("manualmente");
  await form.getByLabel("Montadora").fill("Toyota");
  await form.getByLabel("Modelo", { exact: true }).fill("Corolla");
  await form.getByLabel("Código da peça informado").fill("OEM-123");
  await form.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect.poll(() => state.queries.at(-1)?.get("code")).toBe("OEM-123");
  await expect(
    form.getByLabel("Peça, sintoma ou pergunta automotiva"),
  ).toHaveValue("OEM-123");
  await expect(root.locator(".parts-offer")).toHaveCount(3);
});
