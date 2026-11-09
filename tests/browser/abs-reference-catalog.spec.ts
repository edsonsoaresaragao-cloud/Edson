import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installSpeech } from "./support/part-narration";
import { technicalCatalogs } from "../../src/lib/technical-catalogs";

const path =
  process.env.ABS_CATALOG_PREVIEW_PATH || "/artigos?catalog=freios-abs";
test.beforeEach(async ({ page }) => {
  await installSpeech(page);
  await page.goto(`${path}${path.includes("?") ? "&" : "?"}brand=Fiat`);
  await expect(
    page
      .locator(".abs-reference-catalog")
      .getByRole("button", { name: "Falar ao selecionar" }),
  ).toBeEnabled();
});

test("ABS: oito imagens, busca, filtros, ordem e restauração", async ({
  page,
}) => {
  const root = page.locator(".abs-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(8);
  await expect(
    root.locator(".reference-catalog-card .reference-catalog-art").first(),
  ).toHaveCSS("background-image", /abs-reference\/catalog.webp/);
  await root.getByLabel("Buscar no catálogo").fill("8");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Tubulações de freio",
  );
  await root.getByLabel("Buscar no catálogo").fill("wheel speed sensor");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Sensores de velocidade das rodas",
  );
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Sistema do ABS").selectOption("modulacao");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(3);
  await root.getByLabel("Organizar componentes").selectOption("name");
  await expect(root.locator(".reference-catalog-card h3").first()).toHaveText(
    "Motor elétrico da bomba",
  );
  await root.getByLabel("Buscar no catálogo").fill("inexistente987");
  await expect(
    root.getByRole("heading", {
      name: "Nenhuma imagem corresponde aos filtros",
    }),
  ).toBeVisible();
  await root.getByRole("button", { name: "Restaurar filtros" }).click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(8);
});

test("ABS: fichas com voz, sensor na roda e recirculação do fluido", async ({
  page,
}) => {
  const root = page.locator(".abs-reference-catalog");
  const opener = root.getByRole("button", {
    name: "Ver ficha: Motor elétrico da bomba",
    exact: true,
  });
  await opener.click();
  const dialog = root.getByRole("dialog");
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    "Ilustração didática gerada: Motor elétrico da bomba",
  );
  await expect(dialog).toContainText(
    "ausência de ruído isolada não confirma defeito",
  );
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveAttribute("href", "/pecas?buy=Motor%20el%C3%A9trico%20da%20bomba");
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toMatch(/^Motor elétrico da bomba\. Função:/);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await root
    .getByRole("button", { name: "Conjuntos e funcionamento 7", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(7);
  await root
    .getByRole("button", {
      name: "Ver conjunto: Redução de pressão e recirculação",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText("a montante das válvulas de entrada");
  await expect(dialog).toContainText(
    "O fluido não é simplesmente descartado no reservatório",
  );
  await expect(dialog).toContainText("4. Válvulas solenoides");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root
    .getByRole("button", {
      name: "Ver conjunto: Sensor e elemento de leitura da roda",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText(
    "O sensor não toca a superfície de atrito do disco",
  );
  await expect(dialog).toContainText("1. Sensores de velocidade das rodas");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await expect(
    root.getByRole("button", { name: "Interromper fala" }),
  ).toBeDisabled();
  await expect(
    root.getByRole("link", { name: "Explorar ABS interativo" }),
  ).toHaveAttribute("href", "/categorias/freios-e-abs");
});

test("ABS: biblioteca, URL, imagens e acessibilidade nos dois temas", async ({
  page,
}, info) => {
  const root = page.locator(".abs-reference-catalog"),
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
      path: `test-results/abs-catalog-${info.project.name}-${theme}.png`,
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
    .getByRole("button", {
      name: "Ver ficha: Sensores de velocidade das rodas",
      exact: true,
    })
    .click();
  const modal = await new AxeBuilder({ page })
    .include(".reference-catalog-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(modal.violations.map((item) => item.id)).toEqual([]);
  await page.keyboard.press("Escape");
  await library
    .getByRole("button", {
      name: "Abrir catálogo Injeção multiponto / MPI",
      exact: true,
    })
    .click();
  await expect(
    page.locator(".mpi-reference-catalog .reference-catalog-card"),
  ).toHaveCount(16);
  await library
    .getByRole("button", {
      name: "Abrir catálogo Sistema de freio ABS",
      exact: true,
    })
    .click();
  expect(new URL(page.url()).searchParams.get("catalog")).toBe("freios-abs");
  expect(new URL(page.url()).searchParams.get("brand")).toBe("Fiat");
  await page.reload();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(8);
});
