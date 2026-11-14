import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PDFDocument } from "pdf-lib";
import {
  LESSON_URL,
  ADAPTED_PDF,
  sourcePages,
  pageTranscript,
  steps,
} from "../../src/lib/academy/checklist/content";
import { narrationChunks } from "../../src/lib/academy/narration";
import { installChecklistSpeech } from "./support/checklist-speech";
import { memoryChecklistRepository } from "../fixtures/checklist-progress";
import { changeProgress } from "../../src/lib/academy/checklist/progress";
import { questionsFor } from "../../src/lib/academy/checklist/questions";
test("biblioteca, quatro páginas integrais, zoom, teclado e PDF real", async ({
  page,
  request,
}, testInfo) => {
  await page.goto("/academy/aulas");
  await expect(page.getByRole("link", { name: /AULA 01/ })).toBeVisible();
  await page.getByRole("link", { name: /AULA 02/ }).click();
  await expect(page.getByRole("heading", { name: /AULA 02/ })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Etapas da Aula 02" });
  await expect(nav.getByRole("button")).toHaveCount(5);
  for (const i of sourcePages.keys()) {
    if (i)
      await nav
        .getByRole("button", { name: new RegExp(steps[i].title) })
        .click();
    const viewer = page.getByRole("region", {
      name: "Visualizador do material técnico",
    });
    const image = viewer.locator("img").first();
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBe(1024);
    await expect(image).toHaveAttribute(
      "src",
      new RegExp(`pagina-0${i + 1}.png`),
    );
  }
  const viewer = page.getByRole("region", {
    name: "Visualizador do material técnico",
  });
  await viewer.getByRole("button", { name: "Ampliar página" }).focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Página 4 ampliada" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Zoom da página ampliada").selectOption("200");
  await expect(dialog.locator("img")).toHaveCSS("object-fit", "contain");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  const pdf = await request.get(`/api/academy/aula-02/material/${ADAPTED_PDF}`);
  expect(pdf.ok()).toBe(true);
  expect((await PDFDocument.load(await pdf.body())).getPageCount()).toBe(4);
  expect(
    (await request.get("/api/academy/aula-02/material/original.pdf")).status(),
  ).toBe(403);
  expect((await request.get("/api/academy/aula-02/progress")).status()).toBe(
    401,
  );
  expect(
    (
      await new AxeBuilder({ page })
        .include(".academy-checklist-study")
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("aula02.png") });
});
test("cada botão lê a página inteira, com seus sete pontos e créditos, sem concluir estudo", async ({
  page,
}) => {
  await installChecklistSpeech(page);
  await page.goto(LESSON_URL);
  await expect(
    page.getByRole("button", { name: "Ouvir esta página" }),
  ).toBeEnabled();
  expect(await page.evaluate(() => window.__checklistSpeech.calls.length)).toBe(
    0,
  );
  await page.evaluate(() => {
    window.__checklistSpeech.auto = true;
  });
  for (const [i, source] of sourcePages.entries()) {
    if (i)
      await page
        .getByRole("navigation", { name: "Etapas da Aula 02" })
        .getByRole("button", { name: new RegExp(steps[i].title) })
        .click();
    const reader = page.getByRole("region", {
      name: `Leitura em voz alta da página ${i + 1}`,
    });
    await reader.getByLabel("Velocidade da leitura").selectOption("0.8");
    const before = await page.evaluate(
      () => window.__checklistSpeech.calls.length,
    );
    await reader.getByRole("button", { name: "Ouvir esta página" }).click();
    await expect(reader.getByRole("status")).toHaveText(
      `Leitura da página ${i + 1} concluída.`,
      { timeout: 15000 },
    );
    const calls = await page.evaluate(
      (before) => window.__checklistSpeech.calls.slice(before),
      before,
    );
    expect(calls.map((c) => c.text)).toEqual(
      narrationChunks(pageTranscript(source), 180),
    );
    expect(
      calls.every(
        (c) => c.lang === "pt-BR" && c.rate === 0.8 && c.voice === "br-local",
      ),
    ).toBe(true);
    await reader
      .getByText("Ver texto que será narrado", { exact: true })
      .click();
    await expect(reader).toContainText(source.footnote);
    await expect(
      page.getByRole("progressbar", { name: "Progresso da Aula 02" }),
    ).toHaveAttribute("value", "0");
  }
});
test("pausa, continua, para, muda velocidade, trata erro e cancela a página anterior", async ({
  page,
}) => {
  await installChecklistSpeech(page);
  await page.goto(LESSON_URL);
  const reader = page.getByRole("region", {
    name: "Leitura em voz alta da página 1",
  });
  await reader.getByLabel("Velocidade da leitura").selectOption("1.4");
  await reader
    .getByLabel("Voz em português do Brasil")
    .selectOption("br-remote");
  await reader.getByRole("button", { name: "Ouvir esta página" }).click();
  expect(
    await page.evaluate(() => window.__checklistSpeech.calls.at(-1)),
  ).toMatchObject({ rate: 1.4, voice: "br-remote", lang: "pt-BR" });
  await reader.getByRole("button", { name: "Pausar", exact: true }).click();
  await expect(reader.getByRole("status")).toContainText("Pausado");
  await page.evaluate(() => window.__checklistSpeech.finish());
  const before = await page.evaluate(
    () => window.__checklistSpeech.calls.length,
  );
  await reader.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.__checklistSpeech.calls.length))
    .toBe(before + 1);
  await reader.getByRole("button", { name: "Parar", exact: true }).click();
  await expect(reader.getByRole("status")).toHaveText("Leitura parada.");
  await reader.getByRole("button", { name: "Ouvir esta página" }).click();
  await page.evaluate(() => window.__checklistSpeech.fail());
  await expect(reader.getByRole("alert")).toContainText("Não foi possível");
  await reader.getByRole("button", { name: "Ouvir esta página" }).click();
  const cancel = await page.evaluate(() => window.__checklistSpeech.cancelled);
  await page
    .getByRole("navigation", { name: "Etapas da Aula 02" })
    .getByRole("button", { name: /Correia seca/ })
    .click();
  expect(
    await page.evaluate(() => window.__checklistSpeech.cancelled),
  ).toBeGreaterThan(cancel);
  const newReader = page.getByRole("region", {
    name: "Leitura em voz alta da página 2",
  });
  await expect(newReader.getByRole("status")).toHaveText(
    "Pronto para ler a página 2.",
  );
  const stopped = await page.evaluate(
    () => window.__checklistSpeech.calls.length,
  );
  await page.evaluate(() => window.__checklistSpeech.endPrevious());
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.__checklistSpeech.calls.length)).toBe(
    stopped,
  );
  await page.evaluate(() => {
    window.speechSynthesis.resume = () => {
      throw new Error("indisponível");
    };
  });
  await newReader.getByRole("button", { name: "Ouvir esta página" }).click();
  await expect(newReader.getByRole("alert")).toContainText(
    "Não foi possível iniciar",
  );
});
test("interface de estudo recebe correção e retoma pelo serviço de progresso controlado", async ({
  page,
}) => {
  const repo = memoryChecklistRepository();
  await page.route("**/api/academy/aula-02/progress", async (route) => {
    const payload =
      route.request().method() === "GET"
        ? { progress: await repo.load("ana") }
        : await changeProgress(repo, "ana", route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
  await page.goto(LESSON_URL);
  await page.getByRole("button", { name: "Iniciar aula", exact: true }).click();
  await page
    .getByRole("button", { name: "Marcar estudado", exact: true })
    .click();
  const progress = page.getByRole("progressbar", {
    name: "Progresso da Aula 02",
  });
  await expect(progress).toHaveAttribute("value", "20");
  await page
    .getByRole("navigation", { name: "Etapas da Aula 02" })
    .getByRole("button", { name: /Correia seca/ })
    .click();
  for (const box of await page
    .getByRole("region", { name: "Checklist digital de estudo" })
    .getByRole("checkbox")
    .all())
    await box.check();
  const form = page.locator("form.academy-quiz");
  for (const [i, q] of questionsFor("correia-seca").entries())
    await form
      .locator("fieldset")
      .nth(i)
      .getByRole("radio")
      .nth((q.correctIndex + 1) % q.options.length)
      .check();
  await form
    .getByRole("button", { name: "Corrigir respostas e marcar estudado" })
    .click();
  await expect(
    page.getByRole("status", { name: "Resultado da atividade" }),
  ).toContainText("Você alcançou 0%");
  await expect(progress).toHaveAttribute("value", "20");
  for (const [i, q] of questionsFor("correia-seca").entries())
    await form
      .locator("fieldset")
      .nth(i)
      .getByRole("radio")
      .nth(q.correctIndex)
      .check();
  await form
    .getByRole("button", { name: "Corrigir respostas e marcar estudado" })
    .click();
  await expect(progress).toHaveAttribute("value", "40");
  await page.goto("/academy/aulas");
  await page.getByRole("link", { name: /AULA 02/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Correia seca · Concluída",
      exact: true,
    }),
  ).toBeVisible();
  await expect(progress).toHaveAttribute("value", "40");
});
for (const mode of ["missing", "no-br"] as const)
  test(`transcrição permanece disponível quando a voz está ${mode}`, async ({
    page,
  }) => {
    await installChecklistSpeech(page, mode);
    await page.goto(LESSON_URL);
    const reader = page.getByRole("region", {
      name: "Leitura em voz alta da página 1",
    });
    await expect(
      reader.getByRole("button", { name: "Ouvir esta página" }),
    ).toBeDisabled();
    await reader
      .getByText("Ver texto que será narrado", { exact: true })
      .click();
    await expect(reader).toContainText(sourcePages[0].subtitle);
    await expect(reader).toContainText(
      mode === "missing" ? "não está disponível" : "Não há voz pt-BR",
    );
  });
