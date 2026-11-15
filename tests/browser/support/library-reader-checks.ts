import { expect, type Page } from "@playwright/test";
import { narrationChunks } from "../../../src/lib/academy/narration";
import { installChecklistSpeech } from "./checklist-speech";

/** Instalar antes de qualquer navegação; simula apenas o dispositivo de voz. */
export async function setupLibrarySpeech(page: Page) {
  await installChecklistSpeech(page);
}

/** A resposta inicial atrasada não deve substituir uma página escolhida pelo aluno. */
export async function verifyLibraryResumeNavigation(page: Page, slug: string) {
  const endpoint = `/api/academy/library/${slug}/progress`;
  const pattern = `**${endpoint}`;
  let release = () => {};
  let received = () => {};
  const responseGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requestReceived = new Promise<void>((resolve) => {
    received = resolve;
  });
  await page.route(pattern, async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const response = await route.fetch();
    received();
    await responseGate;
    await route.fulfill({ response });
  });
  try {
    await page.goto(`/academy/aulas/${slug}`);
    await requestReceived;
    const navigation = page.getByRole("navigation", {
      name: /Páginas da Aula/,
    });
    await navigation.getByRole("button").nth(2).click();
    const heading = page.getByRole("heading", {
      name: "Página 3 — Página sintética 3",
      exact: true,
    });
    await expect(heading).toBeVisible();
    const loaded = page.waitForResponse(
      (response) =>
        response.url().endsWith(endpoint) &&
        response.request().method() === "GET",
    );
    release();
    expect((await (await loaded).json()).progress.lastStep).toBe("pagina-1");
    await expect(
      page.getByText(
        "Seu progresso é individual e será retomado ao retornar à aula.",
      ),
    ).toBeVisible();
    await expect(heading).toBeVisible();
    await expect(page).toHaveURL(/#pagina-3$/);
    await navigation.getByRole("button").first().click();
    await expect(
      page.getByRole("heading", {
        name: "Página 1 — Página sintética 1",
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    release();
    await page.unroute(pattern);
  }
}

/** Exercita a sala real usando o material sintético do teste PostgreSQL. */
export async function verifyLibraryReader(
  page: Page,
  expectedOriginal?: string[],
) {
  const reader = page.getByRole("region", {
    name: "Leitura em voz alta da página 1",
    exact: true,
  });
  const start = reader.getByRole("button", {
    name: "Ouvir esta página",
    exact: true,
  });
  await expect(start).toBeEnabled();
  expect(await page.evaluate(() => window.__checklistSpeech.calls.length)).toBe(
    0,
  );
  const paragraphs = await reader.locator("details p").allTextContents();
  expect(paragraphs.length).toBeGreaterThan(0);
  if (expectedOriginal) expect(paragraphs).toEqual(expectedOriginal);
  const expected = narrationChunks(expectedOriginal || paragraphs, 180);
  const progress = page.getByRole("progressbar", { name: /Progresso da Aula/ });
  const initialPercent = await progress.getAttribute("value");
  const rate = reader.getByLabel("Velocidade da leitura");
  expect(
    await rate
      .locator("option")
      .evaluateAll((options) =>
        options.map((option) => (option as HTMLOptionElement).value),
      ),
  ).toEqual(["0.75", "1", "1.25", "1.5"]);
  for (const value of ["0.75", "1", "1.25", "1.5"]) {
    await rate.selectOption(value);
    await start.click();
    expect(
      await page.evaluate(() => window.__checklistSpeech.calls.at(-1)),
    ).toMatchObject({
      text: expected[0],
      rate: Number(value),
      lang: "pt-BR",
      voice: "br-local",
    });
    await expect(reader.getByLabel("Trecho narrado")).toHaveText(expected[0]);
    await reader.getByRole("button", { name: "Pausar", exact: true }).click();
    await expect(reader.getByRole("status")).toContainText("Pausado");
    await reader
      .getByRole("button", { name: "Continuar", exact: true })
      .click();
    await expect(reader.getByRole("status")).toContainText("Lendo página 1");
    await reader.getByRole("button", { name: "Parar", exact: true }).click();
  }
  await start.click();
  const beforeRepeat = await page.evaluate(() => ({
    calls: window.__checklistSpeech.calls.length,
    cancelled: window.__checklistSpeech.cancelled,
  }));
  await reader.getByRole("button", { name: "Repetir", exact: true }).click();
  expect(await page.evaluate(() => window.__checklistSpeech.calls.length)).toBe(
    beforeRepeat.calls + 1,
  );
  expect(
    await page.evaluate(() => window.__checklistSpeech.cancelled),
  ).toBeGreaterThan(beforeRepeat.cancelled);
  expect(
    await page.evaluate(() => window.__checklistSpeech.calls.at(-1)?.text),
  ).toBe(expected[0]);

  const beforeTeacher = await page.evaluate(() => ({
    calls: window.__checklistSpeech.calls.length,
    cancelled: window.__checklistSpeech.cancelled,
  }));
  await page
    .getByRole("button", { name: "Explicação do professor", exact: true })
    .click();
  await expect(reader.getByRole("status")).toHaveText(
    "Pronto para ler a página 1.",
  );
  expect(await page.evaluate(() => window.__checklistSpeech.calls.length)).toBe(
    beforeTeacher.calls,
  );
  expect(
    await page.evaluate(() => window.__checklistSpeech.cancelled),
  ).toBeGreaterThan(beforeTeacher.cancelled);
  const teacherParagraphs = await reader.locator("details p").allTextContents();
  expect(teacherParagraphs.length).toBeGreaterThan(0);
  expect(teacherParagraphs).not.toEqual(paragraphs);
  await page.evaluate(() => {
    window.__checklistSpeech.auto = true;
  });
  const teacherStart = await page.evaluate(
    () => window.__checklistSpeech.calls.length,
  );
  await reader
    .getByRole("button", { name: "Ouvir explicação do professor", exact: true })
    .click();
  await expect(reader.getByRole("status")).toHaveText(
    "Leitura da página 1 concluída.",
  );
  expect(
    await page.evaluate(
      (index) =>
        window.__checklistSpeech.calls.slice(index).map((call) => call.text),
      teacherStart,
    ),
  ).toEqual(narrationChunks(teacherParagraphs, 180));
  await page
    .getByRole("button", { name: "Leitura original", exact: true })
    .click();
  await expect(start).toBeEnabled();
  const originalStart = await page.evaluate(
    () => window.__checklistSpeech.calls.length,
  );
  await start.click();
  await expect(reader.getByRole("status")).toHaveText(
    "Leitura da página 1 concluída.",
    { timeout: 15000 },
  );
  expect(
    await page.evaluate(
      (index) =>
        window.__checklistSpeech.calls.slice(index).map((call) => call.text),
      originalStart,
    ),
  ).toEqual(expected);
  await expect(progress).toHaveAttribute("value", initialPercent!);

  await page.evaluate(() => {
    window.__checklistSpeech.auto = false;
  });
  await start.click();
  const beforePage = await page.evaluate(() => ({
    calls: window.__checklistSpeech.calls.length,
    cancelled: window.__checklistSpeech.cancelled,
  }));
  const navigation = page.getByRole("navigation", { name: /Páginas da Aula/ });
  await navigation.getByRole("button").nth(1).click();
  await expect(
    page
      .getByRole("region", {
        name: "Leitura em voz alta da página 2",
        exact: true,
      })
      .getByRole("status"),
  ).toHaveText("Pronto para ler a página 2.");
  expect(
    await page.evaluate(() => window.__checklistSpeech.cancelled),
  ).toBeGreaterThan(beforePage.cancelled);
  expect(await page.evaluate(() => window.__checklistSpeech.calls.length)).toBe(
    beforePage.calls,
  );
  await page.evaluate(() => window.__checklistSpeech.endPrevious());
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => window.__checklistSpeech.calls.length)).toBe(
    beforePage.calls,
  );
  await expect(progress).toHaveAttribute("value", initialPercent!);
  await navigation.getByRole("button").first().click();
  await expect(start).toBeEnabled();
}
