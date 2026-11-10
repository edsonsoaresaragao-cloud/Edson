import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installSpeech } from "./support/part-narration";
import { emptyCase } from "../../src/lib/alternator-diagnosis/schema";
const path = "/diagnostico/alternador";
const adminPreview = process.env.ALTERNATOR_DIAGNOSIS_ADMIN_PREVIEW;
const catalogPath =
  process.env.ALTERNATOR_DIAGNOSIS_CATALOG_PREVIEW ||
  "/artigos?catalog=alternador";
test.use({ storageState: process.env.TEST_ADMIN_STORAGE_STATE || undefined });
test.setTimeout(120000);
async function ready(page: Page) {
  await installSpeech(page);
  await page.route("**/api/diagnostics/alternator/references*", (route) =>
    route.fulfill({ json: { entries: [] } }),
  );
  await page.goto(path);
  await expect(
    page.getByRole("heading", {
      name: "Diagnóstico avançado do alternador",
      exact: true,
    }),
  ).toBeVisible();
}
async function tab(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Etapas e recursos do diagnóstico" })
    .getByRole("button", { name, exact: true })
    .click();
}
test("diagnóstico: veículo, sintomas, guiado e interpretação condicionada à referência", async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel("Montadora", { exact: true }).fill("Marca teste");
  await page.getByLabel("Modelo", { exact: true }).fill("Modelo A");
  await page.getByLabel("Ano e versão", { exact: true }).fill("2020 A");
  await page.getByLabel("Motorização", { exact: true }).fill("1.0");
  await page.getByLabel("Código da peça", { exact: true }).fill("A123");
  await page
    .getByRole("combobox", { name: "Gerenciamento", exact: true })
    .selectOption("convencional");
  await page.getByLabel("Documento técnico / título").fill("Manual de teste");
  await page
    .getByLabel("Link HTTPS da referência")
    .fill("https://example.com/repair");
  await page
    .getByRole("button", {
      name: "Associar referência informada à identificação atual",
    })
    .click();
  await tab(page, "Sintomas");
  await page.getByLabel("Pesquisar sintoma").fill("consumidores");
  await expect(page.locator(".ad-grid>article")).toHaveCount(1);
  await page
    .getByRole("checkbox", {
      name: "Falha de carga apenas com consumidores ligados",
    })
    .check();
  await page
    .getByRole("button", { name: "Abrir diagnóstico guiado →" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Inspeção inicial", exact: true }),
  ).toBeVisible();
  await page
    .locator("fieldset")
    .first()
    .getByLabel("Resultado")
    .selectOption("aprovado");
  await page
    .locator("fieldset")
    .first()
    .getByLabel("Evidência, método e observação")
    .fill("Inspeção documentada");
  await page
    .getByRole("button", { name: "Próxima etapa →", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Teste da bateria", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "← Etapa anterior" }).click();
  await expect(
    page.locator("fieldset").first().getByLabel("Resultado"),
  ).toHaveValue("aprovado");
  await tab(page, "Testes Elétricos");
  await page
    .getByLabel("Condições de medição", { exact: true })
    .fill("Ensaio conforme manual");
  const reading = page.locator(".ad-reading").filter({
    has: page.getByText("Tensão diretamente no B+ (V)", { exact: true }),
  });
  await reading.locator("input").first().fill("15");
  await reading.getByText("Referência deste teste", { exact: true }).click();
  await reading.getByLabel("Mínimo (V)").fill("13.5");
  await reading.getByLabel("Máximo (V)").fill("14.8");
  await expect(
    reading.getByText("fora da referência", { exact: true }),
  ).toBeVisible();
  await tab(page, "Visão Geral");
  await page.getByLabel("Código da peça", { exact: true }).fill("B456");
  await tab(page, "Testes Elétricos");
  await expect(
    reading.getByText("evidência insuficiente", { exact: true }),
  ).toBeVisible();
  await tab(page, "Resultado");
  await expect(page.locator(".ad-panel")).not.toContainText(
    "Falha confirmada por teste",
  );
});
test("diagnóstico: rascunho, salvar/retomar, conflito e exportações reais", async ({
  page,
}, info) => {
  await ready(page);
  let saved: ReturnType<typeof emptyCase> | null = null;
  const id = "c15b0762-23c9-4f83-b96b-13cb8843f9df";
  let conflict = false;
  await page.route("**/api/diagnostics/alternator*", async (route) => {
    if (route.request().url().includes("/references"))
      return route.fulfill({ json: { entries: [] } });
    const method = route.request().method();
    if (method === "POST" || method === "PUT") {
      if (conflict)
        return route.fulfill({
          status: 409,
          json: { error: "Registro alterado. Reabra a versão salva." },
        });
      saved = route.request().postDataJSON().data;
      return route.fulfill({
        json: {
          id,
          revision: 1,
          data: saved,
          createdAt: "2026-11-09T12:00:00Z",
        },
      });
    }
    if (new URL(route.request().url()).searchParams.has("id"))
      return route.fulfill({
        json: {
          id,
          revision: 1,
          data: saved,
          createdAt: "2026-11-09T12:00:00Z",
        },
      });
    return route.fulfill({
      json: {
        cases: saved
          ? [
              {
                id,
                make: "Marca salva",
                model: "Modelo salvo",
                updatedAt: "2026-11-09T12:00:00Z",
              },
            ]
          : [],
      },
    });
  });
  await page.getByLabel("Montadora", { exact: true }).fill("Marca salva");
  await page
    .getByRole("button", { name: "Salvar rascunho nesta aba", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "Retomar rascunho da aba", exact: true })
    .click();
  await expect(page.getByLabel("Montadora", { exact: true })).toHaveValue(
    "Marca salva",
  );
  await page
    .getByRole("button", { name: "Salvar na conta", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("salvo na sua conta");
  await page.getByLabel("Montadora", { exact: true }).fill("Alteração local");
  await page
    .getByRole("button", { name: "Retomar diagnóstico", exact: true })
    .click();
  await page
    .getByRole("button", { name: new RegExp("Marca salva Modelo salvo") })
    .click();
  await expect(page.getByLabel("Montadora", { exact: true })).toHaveValue(
    "Marca salva",
  );
  conflict = true;
  await page
    .getByRole("button", { name: "Salvar na conta", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Reabra a versão salva");
  await tab(page, "Relatório");
  const pdf = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar PDF", exact: true }).click();
  await (
    await pdf
  ).saveAs(`test-results/alternator-report-${info.project.name}.pdf`);
  await expect(page.locator(".ad-report")).toContainText(id);
  await expect(page.locator(".ad-report")).toContainText(
    "Causa confirmada: Não estabelecida",
  );
  const text = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar texto", exact: true })
    .click();
  expect((await text).suggestedFilename()).toMatch(/\.txt$/);
  await page.getByLabel("Status do diagnóstico").selectOption("resolvido");
  await expect(page.locator(".ad-panel [role=status]")).toContainText(
    "Resolvido exige",
  );
  await page
    .getByRole("button", { name: "Salvar na conta", exact: true })
    .click();
  await expect(page.locator(".ad-message")).toContainText("Resolvido exige");
});
test("diagnóstico: 16 fichas, seleção no 3D, DTC, catálogo e fluxo sem login", async ({
  page,
}) => {
  await ready(page);
  await page.route("**/api/diagnostics/alternator", (route) =>
    route.fulfill({
      status: 401,
      json: { error: "Entre na sua conta para continuar." },
    }),
  );
  await page
    .getByRole("button", { name: "Salvar na conta", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Entre na sua conta");
  await tab(page, "Componentes");
  await expect(page.locator(".ad-component-buttons button")).toHaveCount(16);
  await page
    .getByRole("button", { name: "8. Porta-escovas", exact: true })
    .click();
  await expect(page.locator(".ad-panel>article h3")).toHaveText(
    "8. Porta-escovas",
  );
  await expect(
    page.locator(".alternator-explorer .suspension-detail h3"),
  ).toHaveText("Porta-escovas");
  await page
    .locator(".alternator-explorer .suspension-parts>ol>li>button")
    .nth(8)
    .click();
  await expect(page.locator(".ad-panel>article h3")).toHaveText(
    "9. Ponte retificadora",
  );
  await page
    .getByRole("button", { name: "Diagnosticar este componente", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ondulação / ripple", exact: true }),
  ).toBeVisible();
  await tab(page, "Osciloscópio");
  await page.getByLabel("Padrão ilustrado").selectOption("open");
  await expect(page.locator(".ad-wave")).toHaveAccessibleName(/diodo aberto/);
  await tab(page, "Códigos de Falha");
  await page.getByLabel("Pesquisar código ou descrição").fill("P0625");
  await expect(page.locator(".ad-panel details")).toHaveCount(1);
  await page.locator(".ad-panel summary").click();
  await expect(page.locator(".ad-panel")).toContainText(
    "Um DTC isolado não confirma",
  );
  await page
    .getByRole("link", { name: "Catálogo ilustrado ↗", exact: true })
    .click();
});
test("diagnóstico: acessibilidade, impressão e uso nos dois temas", async ({
  page,
}, info) => {
  await ready(page);
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (theme) => (document.documentElement.dataset.theme = theme),
      theme,
    );
    const result = await new AxeBuilder({ page })
      .include(".alternator-diagnosis")
      .analyze();
    expect(result.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
  }
  await tab(page, "Relatório");
  await page
    .getByLabel("Reparo recomendado / executado")
    .fill("Teste de relatório, sem reparo confirmado");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".ad-report")).toHaveCSS("visibility", "visible");
  await page.emulateMedia({ media: "screen" });
  await page.screenshot({
    path: `test-results/alternator-diagnosis-${info.project.name}.png`,
    fullPage: true,
  });
});
test("diagnóstico: cadastro administrativo e acesso pelo catálogo preservam as funções existentes", async ({
  page,
}) => {
  await installSpeech(page);
  let payload: unknown = null;
  await page.route(
    "**/api/diagnostics/alternator/references*",
    async (route) => {
      if (route.request().method() === "POST") {
        payload = route.request().postDataJSON();
        return route.fulfill({
          json: { id: "7cc09a33-ef22-4538-bc8e-54a46edf9b78" },
        });
      }
      return route.fulfill({ json: { entries: [] } });
    },
  );
  test.skip(
    !adminPreview && !process.env.TEST_ADMIN_STORAGE_STATE,
    "Configure estado autenticado ADMIN para o teste de administração.",
  );
  await page.goto(adminPreview || "/admin/diagnostico-alternador");
  await page
    .getByRole("combobox", { name: "Tipo", exact: true })
    .selectOption("procedure");
  await page
    .getByLabel("Título", { exact: true })
    .fill("Procedimento de teste");
  await page
    .getByLabel("Fonte / titular e licença quando houver imagem")
    .fill("Fabricante teste");
  await page
    .getByLabel("URL HTTPS da documentação")
    .fill("https://example.com/repair");
  await page
    .getByLabel("Aplicabilidade", { exact: true })
    .fill("Aplicação específica teste");
  await page
    .getByLabel("Conteúdo técnico / condições e procedimento")
    .fill("Procedimento documentado para o ensaio de teste.");
  await page.getByRole("button", { name: "Salvar referência técnica" }).click();
  await expect.poll(() => payload).not.toBeNull();
  await expect(page.getByRole("status")).toContainText("Referência salva");
  await page.goto(catalogPath);
  await expect(
    page.getByRole("link", {
      name: "DIAGNÓSTICO AVANÇADO DO ALTERNADOR ↗",
      exact: true,
    }),
  ).toHaveAttribute("href", "/diagnostico/alternador");
  await page
    .getByRole("button", { name: "Ver ficha: Rotor", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Diagnosticar este componente ↗", exact: true })
    .click();
  await expect(page).toHaveURL(/diagnostico\/alternador\?component=5/);
});

test("diagnóstico: seleção externa e clique no modelo WebGL mantêm peça e ficha sincronizadas", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installSpeech(page, true);
  await page.route("**/api/diagnostics/alternator/references*", (route) =>
    route.fulfill({ json: { entries: [] } }),
  );
  await page.goto("/diagnostico/alternador?component=9");
  const root = page.locator(".alternator-explorer");
  await expect(root).toHaveAttribute("data-renderer", "ready", {
    timeout: 45000,
  });
  await root.getByRole("button", { name: /Pausar/ }).click();
  await expect(page.locator(".ad-panel>article h3")).toHaveText(
    "9. Ponte retificadora",
  );
  await page.getByRole("button", { name: "5. Rotor", exact: true }).click();
  await expect(root.locator(".suspension-detail h3")).toHaveText("Rotor");
  await root.locator(".suspension-annotations button").nth(7).click();
  await expect(page.locator(".ad-panel>article h3")).toHaveText(
    "8. Porta-escovas",
  );
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toMatch(/^Porta-escovas\. Função:/);
  await page.locator(".ad-hero").screenshot({
    path: `test-results/alternator-diagnosis-hero-${info.project.name}.png`,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
});
