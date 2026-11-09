import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installSpeech } from "./support/part-narration";
import { technicalCatalogs } from "../../src/lib/technical-catalogs";

const path =
  process.env.MPI_CATALOG_PREVIEW_PATH || "/artigos?catalog=injecao-mpi";
test.beforeEach(async ({ page }) => {
  await installSpeech(page);
  await page.goto(`${path}${path.includes("?") ? "&" : "?"}brand=Fiat`);
  await expect(
    page
      .locator(".mpi-reference-catalog")
      .getByRole("button", { name: "Falar ao selecionar" }),
  ).toBeEnabled();
});

test("MPI: 16 imagens, busca, sistemas, ordem e estado vazio", async ({
  page,
}) => {
  const root = page.locator(".mpi-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(16);
  await expect(
    root.locator(".reference-catalog-card .reference-catalog-art").first(),
  ).toHaveCSS("background-image", /mpi-reference\/catalog.webp/);
  await root.getByLabel("Buscar no catálogo").fill("16");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Cânister",
  );
  await root.getByLabel("Buscar no catálogo").fill("pintle");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Atuador de marcha lenta / IAC",
  );
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Sistema da injeção").selectOption("combustivel");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(5);
  await root.getByLabel("Organizar componentes").selectOption("name");
  await expect(root.locator(".reference-catalog-card h3").first()).toHaveText(
    "Bomba de combustível",
  );
  await root.getByLabel("Buscar no catálogo").fill("inexistente987");
  await expect(
    root.getByRole("heading", {
      name: "Nenhuma imagem corresponde aos filtros",
    }),
  ).toBeVisible();
  await root.getByRole("button", { name: "Restaurar filtros" }).click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(16);
});

test("MPI: fichas ampliadas, voz e oito vistas de funcionamento", async ({
  page,
}) => {
  const root = page.locator(".mpi-reference-catalog");
  const opener = root.getByRole("button", {
    name: "Ver ficha: Injetores MPI",
    exact: true,
  });
  await opener.click();
  const dialog = root.getByRole("dialog");
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    "Ilustração didática gerada: Injetores MPI",
  );
  await expect(dialog).toContainText("não injeção direta na câmara");
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveAttribute("href", "/pecas?buy=Injetores%20MPI");
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toMatch(/^Injetores MPI\. Função:/);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await root
    .getByRole("button", { name: "Conjuntos e funcionamento 8", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(8);
  await root
    .getByRole("button", {
      name: "Ver conjunto: Cânister e sistema de purga",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText(
    "Sem passagem de combustível líquido pelo cânister",
  );
  await expect(dialog).toContainText("16. Cânister");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root
    .getByRole("button", {
      name: "Ver conjunto: Admissão e marcha lenta",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText("MAP ou borboleta eletrônica");
  await expect(dialog).toContainText("9. Atuador de marcha lenta / IAC");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await expect(
    root.getByRole("button", { name: "Interromper fala" }),
  ).toBeDisabled();
  await expect(
    root.getByRole("link", { name: "Explorar injeção MPI interativa" }),
  ).toHaveAttribute("href", "/categorias/injecao-eletronica");
});

test("MPI: biblioteca, URL, imagens e acessibilidade nos dois temas", async ({
  page,
}, info) => {
  const root = page.locator(".mpi-reference-catalog"),
    library = page.locator(".technical-catalog-library");
  await expect(
    library
      .getByRole("group", { name: "Escolher catálogo técnico" })
      .getByRole("button"),
  ).toHaveCount(Object.keys(technicalCatalogs).length);
  for (const theme of ["light", "dark"]) {
    const result = await new AxeBuilder({ page })
      .include(".technical-catalog-library")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((item) => ({
        id: item.id,
        targets: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
    await root.screenshot({
      path: `test-results/mpi-catalog-${info.project.name}-${theme}.png`,
    });
    if (theme === "light")
      await page
        .getByRole("button", { name: "Alternar tema claro e escuro" })
        .click();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await root
    .getByRole("button", { name: "Ver ficha: Injetores MPI", exact: true })
    .click();
  const modal = await new AxeBuilder({ page })
    .include(".reference-catalog-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(modal.violations.map((item) => item.id)).toEqual([]);
  await page.keyboard.press("Escape");
  await library
    .getByRole("button", {
      name: "Abrir catálogo Chave e imobilizador",
      exact: true,
    })
    .click();
  await expect(
    page.locator(".immobilizer-reference-catalog .reference-catalog-card"),
  ).toHaveCount(9);
  await library
    .getByRole("button", {
      name: "Abrir catálogo Injeção multiponto / MPI",
      exact: true,
    })
    .click();
  expect(new URL(page.url()).searchParams.get("catalog")).toBe("injecao-mpi");
  expect(new URL(page.url()).searchParams.get("brand")).toBe("Fiat");
  await page.reload();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(16);
});
